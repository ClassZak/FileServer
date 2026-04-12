package org.zak.service

import jakarta.annotation.PostConstruct
import jakarta.persistence.EntityManager
import jakarta.persistence.EntityNotFoundException
import jakarta.persistence.PersistenceContext
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import org.zak.dto.CurrentUser
import org.zak.dto.file.FileInfo
import org.zak.dto.file.FolderInfo
import org.zak.entity.*
import org.zak.repository.*
import java.io.File
import java.io.IOException
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.nio.file.StandardCopyOption
import java.nio.file.attribute.BasicFileAttributes
import java.time.LocalDateTime
import java.util.*
import kotlin.io.path.absolute
import kotlin.io.path.createDirectories
import kotlin.io.path.exists

/**
 * Типы доступа, представленные в виде битовой маски.
 * Значения соответствуют стандартным правам UNIX: NONE, CREATE, READ, UPDATE, DELETE, ALL.
 */
enum class AccessType(val value: Int) {
	NONE(0),
	CREATE(1),
	READ(2),
	UPDATE(4),
	DELETE(8),
	ALL(CREATE.value or READ.value or UPDATE.value or DELETE.value);
	
	/** Побитовое ИЛИ двух масок доступа. */
	infix fun or(other: AccessType): Int = this.value or other.value
	/** Побитовое И двух масок доступа. */
	infix fun and(other: AccessType): Int = this.value and other.value
}

/**
 * Информация об удалённом файле для передачи клиенту.
 */
data class DeletedFileInfo(
	val id: Long,
	val originalPath: String,
	val deletedAt: LocalDateTime,
	val version: Int,
	val deletedByUserId: Int,
	val deletedByUserEmail: String
)

/**
 * Информация об удалённой папке для передачи клиенту.
 */
data class DeletedFolderInfo(
	val id: Long,
	val originalPath: String,
	val deletedAt: LocalDateTime,
	val version: Int,
	val deletedByUserId: Int,
	val deletedByUserEmail: String
)

/**
 * Сервис для управления файловой системой с учётом прав доступа, версионирования удалений
 * и ведения истории операций.
 *
 * Основные возможности:
 * - Проверка прав доступа к папкам и файлам (с наследованием и комбинированием).
 * - Листинг содержимого директорий с учётом видимости (просвечивание папок с доступными вложениями).
 * - Создание папок и загрузка файлов с записью в БД и историю.
 * - Удаление в корзину с версионированием (метки _vN_timestamp).
 * - Восстановление файлов и папок из корзины.
 * - Окончательное удаление (только для администратора) с обновлением истории.
 * - Управление явными правами доступа для папок и файлов.
 * - Получение списка удалённых объектов и истории операций.
 * - Работа с групповыми папками (создание, удаление, переименование при изменении группы).
 */
@Service
class FileSystemService(
	private val groupService: GroupService,
	private val userService: UserService,
	private val fileEntityRepository: FileEntityRepository,
	private val folderEntityRepository: FolderEntityRepository,
	private val filePermissionRepository: FilePermissionRepository,
	private val folderPermissionRepository: FolderPermissionRepository,
	private val deletedFileRepository: DeletedFileRepository,
	private val deletedFolderRepository: DeletedFolderRepository,
	private val operationTypeRepository: OperationTypeRepository,
	private val workHistoryRepository: WorkHistoryRepository
) {
	
	@PersistenceContext
	private lateinit var entityManager: EntityManager
	
	private val logger = LoggerFactory.getLogger(FileSystemService::class.java)
	private val groupsDir = "groups"
	private val recoveredDir = "recovered"
	
	@Value("\${file-server.root-directory:./files}")
	private lateinit var rootDirectory: String
	
	@Value("\${file-server.deleted-directory:./deleted_files}")
	private lateinit var rootDirectoryDeleted: String
	
	private lateinit var safeRootPath: Path
	private lateinit var safeRootPathDeleted: Path
	
	/**
	 * Инициализация сервиса после внедрения зависимостей.
	 * Создаёт корневые директории и папку `groups`, если они отсутствуют.
	 */
	@PostConstruct
	fun init() {
		safeRootPath = Paths.get(rootDirectory).normalize().toAbsolutePath()
		if (!Files.exists(safeRootPath)) {
			Files.createDirectories(safeRootPath)
			logger.info("Создана корневая директория: $safeRootPath")
		}
		
		val groupsFolder = safeRootPath.resolve(groupsDir).toFile()
		if (!groupsFolder.exists()) {
			groupsFolder.mkdirs()
			logger.info("Создана директория групп: $groupsFolder")
		}
		
		safeRootPathDeleted = Paths.get(rootDirectoryDeleted).normalize().toAbsolutePath()
		if (!Files.exists(safeRootPathDeleted)) {
			Files.createDirectories(safeRootPathDeleted)
			logger.info("Создана корневая директория удалённых файлов: $safeRootPathDeleted")
		}
		
		logger.info("Файловый сервис инициализирован. Корневая директория: $safeRootPath")
	}
	
	// ================== УТИЛИТЫ ПУТЕЙ ==================
	
	/**
	 * Преобразует относительный путь запроса в безопасный абсолютный путь внутри корневой директории.
	 * @throws SecurityException если путь выходит за пределы разрешённой директории.
	 */
	private fun getSafePath(requestedPath: String): Path {
		val pathComponents = requestedPath.split('/')
			.filter { it.isNotBlank() }
			.map { sanitizeFileName(it) }
		val sanitizedPath = pathComponents.joinToString("/")
		val resolved = safeRootPath.resolve(sanitizedPath).normalize()
		if (!resolved.startsWith(safeRootPath)) {
			throw SecurityException("Доступ за пределы корневой директории запрещён")
		}
		return resolved
	}
	
	/** Возвращает относительный путь от корневой директории. */
	private fun getRelativePath(absolutePath: Path): String {
		return safeRootPath.relativize(absolutePath.normalize()).toString().replace("\\", "/")
	}
	
	/** Заменяет недопустимые символы в имени файла/папки на '_'. */
	private fun sanitizeFileName(fileName: String): String {
		return fileName.replace(Regex("[<>:\"\\\\|?*]"), "_")
	}
	
	/**
	 * Проверяет, не существует ли уже удалённая сущность с указанным путём.
	 * @throws IllegalStateException если файл или папка были ранее удалены (isDeleted = true).
	 */
	private fun checkNotDeleted(path: String) {
		val file = fileEntityRepository.findByPath(path)
		if (file != null && file.isDeleted) {
			throw IllegalStateException("Файл был ранее удалён")
		}
		val folder = folderEntityRepository.findByPath(path)
		if (folder != null && folder.isDeleted) {
			throw IllegalStateException("Папка была ранее удалена")
		}
	}
	
	// ================== ПРОВЕРКА ПРАВ ==================
	
	/**
	 * Вычисляет эффективные права доступа текущего пользователя к директории.
	 *
	 * Алгоритм:
	 * - Администратор всегда имеет полный доступ.
	 * - Для пустого пути (корень) не-админ получает NONE.
	 * - Папка `groups` доступна только на чтение.
	 * - Для групповых папок (`groups/groupName/...`) участники группы по умолчанию имеют ALL,
	 *   который может быть переопределён явными разрешениями в `FolderPermission`.
	 * - Для остальных путей права вычисляются как побитовое ИЛИ всех разрешений,
	 *   найденных для текущего пользователя и его групп вдоль всей иерархии папок.
	 *
	 * @param currentUser аутентифицированный пользователь
	 * @param path относительный путь к директории
	 * @return битовая маска разрешённых операций (AccessType)
	 */
	fun checkAccessForDirectory(currentUser: CurrentUser, path: String): Int {
		if (currentUser.isAdmin) return AccessType.ALL.value
		
		val safePath = getRelativePath(getSafePath(path))
		val userId = currentUser.id!!
		
		if (safePath.isEmpty()) return AccessType.NONE.value
		if (safePath == groupsDir) return AccessType.READ.value
		
		if (isGroupDirectory(safePath)) {
			val groupName = extractGroupFromPath(safePath) ?: return AccessType.NONE.value
			val group = groupService.findByName(groupName) ?: return AccessType.NONE.value
			if (!groupService.hasUserAccessToGroup(userId, groupName)) return AccessType.NONE.value
			
			var current = safePath
			var permissions = AccessType.ALL.value
			val user = userService.getUserEntityById(userId)!!
			while (current.isNotEmpty()) {
				val folderEntity = folderEntityRepository.findByPath(current)
				if (folderEntity != null) {
					folderPermissionRepository.findByFolderEntityAndUser(folderEntity, user)?.let {
						permissions = it.mode.toInt()
					}
					folderPermissionRepository.findByFolderEntityAndGroup(folderEntity, group)?.let {
						permissions = permissions or it.mode.toInt()
					}
				}
				current = current.substringBeforeLast("/", "")
			}
			return permissions
		}
		
		var current = safePath
		var permissions = AccessType.NONE.value
		val user = userService.getUserEntityById(userId)!!
		val groups = groupService.findByMemberId(userId)
		while (current.isNotEmpty()) {
			val folderEntity = folderEntityRepository.findByPath(current)
			if (folderEntity != null) {
				folderPermissionRepository.findByFolderEntityAndUser(folderEntity, user)?.let {
					permissions = permissions or it.mode.toInt()
				}
				groups.forEach { group ->
					folderPermissionRepository.findByFolderEntityAndGroup(folderEntity, group)?.let {
						permissions = permissions or it.mode.toInt()
					}
				}
			}
			current = current.substringBeforeLast("/", "")
		}
		return permissions
	}
	
	/**
	 * Вычисляет эффективные права доступа к файлу.
	 * Сначала проверяются явные разрешения на сам файл, затем права родительской директории.
	 */
	fun checkAccessForFile(currentUser: CurrentUser, path: String, fileName: String): Int {
		if (currentUser.isAdmin) return AccessType.ALL.value
		
		val safePath = getRelativePath(getSafePath(path))
		val safeFullPath = if (safePath.isEmpty()) fileName else "$safePath/$fileName"
		val dirPermissions = checkAccessForDirectory(currentUser, path)
		val userId = currentUser.id!!
		val user = userService.getUserEntityById(userId)!!
		val groups = groupService.findByMemberId(userId)
		
		val fileEntity = fileEntityRepository.findByPath(safeFullPath)
		if (fileEntity != null) {
			filePermissionRepository.findByFileEntityAndUser(fileEntity, user)?.let {
				return it.mode.toInt()
			}
			groups.forEach { group ->
				filePermissionRepository.findByFileEntityAndGroup(fileEntity, group)?.let {
					return it.mode.toInt()
				}
			}
		}
		return dirPermissions
	}
	
	/** Проверяет, находится ли путь внутри директории `groups`. */
	private fun isGroupDirectory(path: String): Boolean = path.startsWith("$groupsDir/")
	
	/** Извлекает имя группы из пути вида `groups/groupName/...`. */
	private fun extractGroupFromPath(pathString: String): String? {
		val parts = pathString.split('/')
		return if (parts.size >= 2 && parts[0] == groupsDir) parts[1] else null
	}
	
	// ================== ЛИСТИНГ ==================
	
	/**
	 * Возвращает список файлов и папок в указанной директории, учитывая права доступа.
	 * Папки, на которые у пользователя нет прямого права READ, всё равно отображаются,
	 * если внутри есть доступные для чтения элементы (просвечивание).
	 */
	fun listDirectoryByPermissions(currentUser: CurrentUser, relativePath: String): Pair<List<FileInfo>, List<FolderInfo>> {
		val permissions = checkAccessForDirectory(currentUser, relativePath)
		if ((permissions and AccessType.READ.value) == 0) {
			throw SecurityException("Нет прав на чтение директории: $relativePath")
		}
		
		val directory = getSafePath(relativePath).toFile()
		if (!directory.exists() || !directory.isDirectory) {
			throw IllegalArgumentException("Директория не найдена: $relativePath")
		}
		
		val filesList = mutableListOf<FileInfo>()
		val foldersList = mutableListOf<FolderInfo>()
		
		directory.listFiles()?.forEach { file ->
			try {
				val relPath = getRelativePath(file.toPath())
				if (file.isFile) {
					val filePerm = checkAccessForFile(currentUser, relPath.substringBeforeLast("/"), file.name)
					if ((filePerm and AccessType.READ.value) != 0) {
						filesList.add(createFileInfo(file))
					}
				} else if (file.isDirectory) {
					val folderPerm = checkAccessForDirectory(currentUser, relPath)
					val shouldShow = (folderPerm and AccessType.READ.value != 0) || hasAnyReadableChild(currentUser, relPath)
					if (shouldShow) {
						foldersList.add(createFolderInfo(file))
					}
				}
			} catch (e: SecurityException) {
				logger.warn("Нет доступа к: ${file.name}")
			}
		}
		
		foldersList.sortBy { it.name.lowercase() }
		filesList.sortBy { it.name.lowercase() }
		return Pair(filesList, foldersList)
	}
	
	/**
	 * Проверяет, есть ли внутри папки хотя бы один дочерний элемент (файл или папка),
	 * доступный текущему пользователю для чтения.
	 */
	private fun hasAnyReadableChild(currentUser: CurrentUser, folderPath: String): Boolean {
		val childrenFiles = fileEntityRepository.findByPathStartingWith(folderPath + "/")
		if (childrenFiles.any { file ->
				!file.isDeleted && (checkAccessForFile(currentUser, file.path.substringBeforeLast("/"), file.path.substringAfterLast("/")) and AccessType.READ.value) != 0
			}) return true
		
		val childrenFolders = folderEntityRepository.findByPathStartingWith(folderPath + "/")
		return childrenFolders.any { childFolder ->
			!childFolder.isDeleted && (checkAccessForDirectory(currentUser, childFolder.path) and AccessType.READ.value) != 0
		}
	}
	
	// ================== СОЗДАНИЕ ПАПКИ ==================
	
	/**
	 * Создаёт новую папку с проверкой прав и записью в БД и историю.
	 * @throws SecurityException если нет права CREATE.
	 * @throws IllegalStateException если папка была ранее удалена.
	 */
	@Transactional
	fun createFolderByPermissions(currentUser: CurrentUser, relativePath: String, folderName: String): FolderInfo {
		val permissions = checkAccessForDirectory(currentUser, relativePath)
		if ((permissions and AccessType.CREATE.value) == 0) {
			throw SecurityException("Нет прав на создание папки в: $relativePath")
		}
		
		val parentDir = getSafePath(relativePath).toFile()
		if (!parentDir.exists() || !parentDir.isDirectory) {
			throw IllegalArgumentException("Родительская директория не найдена")
		}
		
		val sanitized = sanitizeFileName(folderName)
		val newFolder = File(parentDir, sanitized)
		val folderPath = if (relativePath.isEmpty()) sanitized else "$relativePath/$sanitized"
		
		if (newFolder.exists()) {
			throw IllegalArgumentException("Папка '$sanitized' уже существует")
		}
		checkNotDeleted(folderPath)
		
		if (!newFolder.mkdirs()) {
			throw IllegalStateException("Не удалось создать папку")
		}
		
		val folderEntity = FolderEntity(path = folderPath, isDeleted = false)
		folderEntityRepository.save(folderEntity)
		
		recordHistory(
			operationName = "CREATE",
			user = currentUser.userDetails!!,
			folderEntity = folderEntity,
			path = folderPath,
			isFile = false
		)
		
		logger.info("Папка создана: $folderPath")
		return createFolderInfo(newFolder)
	}
	
	// ================== ЗАГРУЗКА ФАЙЛА ==================
	
	/**
	 * Загружает файл в указанную директорию с проверкой прав, созданием сущности и записью в историю.
	 */
	@Transactional
	fun uploadFileByPermissions(currentUser: CurrentUser, relativePath: String, file: MultipartFile): FileInfo {
		val permissions = checkAccessForDirectory(currentUser, relativePath)
		if ((permissions and AccessType.CREATE.value) == 0) {
			throw SecurityException("Нет прав на загрузку в: $relativePath")
		}
		
		val targetDir = getSafePath(relativePath).toFile()
		if (!targetDir.exists() || !targetDir.isDirectory) {
			throw IllegalArgumentException("Целевая директория не найдена")
		}
		
		val fileName = sanitizeFileName(file.originalFilename ?: "unnamed")
		val targetFile = File(targetDir, fileName)
		val filePath = if (relativePath.isEmpty()) fileName else "$relativePath/$fileName"
		
		if (targetFile.exists()) {
			throw IllegalArgumentException("Файл '$fileName' уже существует")
		}
		checkNotDeleted(filePath)
		
		file.transferTo(targetFile)
		
		val fileEntity = FileEntity(path = filePath, isDeleted = false)
		fileEntityRepository.save(fileEntity)
		
		recordHistory(
			operationName = "UPLOAD",
			user = currentUser.userDetails!!,
			fileEntity = fileEntity,
			path = filePath,
			isFile = true
		)
		
		logger.info("Файл загружен: $filePath")
		return createFileInfo(targetFile)
	}
	
	// ================== УДАЛЕНИЕ В КОРЗИНУ С ВЕРСИОНИРОВАНИЕМ ==================
	
	/**
	 * Перемещает файл или папку в корзину с сохранением версии.
	 * Для файлов/папок, удаляемых повторно, увеличивается номер версии,
	 * а в корзине создаётся копия с именем, содержащим `_v{version}_{timestamp}`.
	 */
	@Transactional
	fun deleteByPermissionsAndSaveCopy(currentUser: CurrentUser, relativePath: String): Boolean {
		val target = getSafePath(relativePath).toFile()
		if (!target.exists()) {
			throw IllegalArgumentException("Файл или папка не найдены: $relativePath")
		}
		
		val parentPath = Paths.get(relativePath).parent?.toString() ?: ""
		val permissions = checkAccessForDirectory(currentUser, parentPath)
		if ((permissions and AccessType.DELETE.value) == 0) {
			throw SecurityException("Нет прав на удаление: $relativePath")
		}
		if (relativePath == groupsDir) {
			throw SecurityException("Папка групп неудаляема")
		}
		
		val isFile = target.isFile
		val entity = if (isFile) {
			fileEntityRepository.findByPath(relativePath)
		} else {
			folderEntityRepository.findByPath(relativePath)
		} ?: throw EntityNotFoundException("Сущность не найдена в БД: $relativePath")
		
		val version = if (isFile) {
			(deletedFileRepository.findByFileEntityOrderByVersionDesc(entity as FileEntity).maxOfOrNull { it.version } ?: 0) + 1
		} else {
			(deletedFolderRepository.findByFolderEntityOrderByVersionDesc(entity as FolderEntity).maxOfOrNull { it.version } ?: 0) + 1
		}
		
		val timestamp = System.currentTimeMillis()
		val deletedRelativePath = if (isFile) {
			generateDeletedFilePath(relativePath, timestamp, version)
		} else {
			generateDeletedFolderPath(relativePath, timestamp, version)
		}
		
		val deleted = moveItemWithVersioning(target.absolutePath, safeRootPathDeleted.toFile(), safeRootPath.toFile(), deletedRelativePath)
		if (!deleted) {
			throw RuntimeException("Не удалось переместить в корзину")
		}
		
		val user = currentUser.userDetails!!
		if (isFile) {
			entity as FileEntity
			entity.isDeleted = true
			fileEntityRepository.save(entity)
			val deletedFile = DeletedFile(
				fileEntity = entity,
				originalPath = relativePath,
				deletedByUser = user,
				version = version
			)
			deletedFileRepository.save(deletedFile)
			recordHistory("DELETE", user, fileEntity = entity, path = relativePath, isFile = true,
				details = "{\"version\": $version, \"deletedPath\": \"$deletedRelativePath\"}")
		} else {
			entity as FolderEntity
			entity.isDeleted = true
			folderEntityRepository.save(entity)
			val deletedFolder = DeletedFolder(
				folderEntity = entity,
				originalPath = relativePath,
				deletedByUser = user,
				version = version
			)
			deletedFolderRepository.save(deletedFolder)
			recordHistory("DELETE", user, folderEntity = entity, path = relativePath, isFile = false,
				details = "{\"version\": $version, \"deletedPath\": \"$deletedRelativePath\"}")
		}
		
		logger.info("Перемещено в корзину: $relativePath -> $deletedRelativePath (v$version)")
		return true
	}
	
	/** Генерирует путь для удалённого файла с меткой версии и временной меткой. */
	fun generateDeletedFilePath(originalPath: String, timestamp: Long, version: Int): String {
		val baseName = Paths.get(originalPath).fileName.toString()
		val nameWithoutExt = baseName.substringBeforeLast(".")
		val ext = if (baseName.contains(".")) ".${baseName.substringAfterLast(".")}" else ""
		val parentDir = Paths.get(originalPath).parent?.toString() ?: ""
		val newName = "${nameWithoutExt}_v${version}_$timestamp$ext"
		return if (parentDir.isEmpty()) newName else "$parentDir/$newName"
	}
	
	/** Генерирует путь для удалённой папки с меткой версии и временной меткой. */
	fun generateDeletedFolderPath(originalPath: String, timestamp: Long, version: Int): String {
		val folderName = Paths.get(originalPath).fileName.toString()
		val parentDir = Paths.get(originalPath).parent?.toString() ?: ""
		val newName = "${folderName}_v${version}_$timestamp"
		return if (parentDir.isEmpty()) newName else "$parentDir/$newName"
	}
	
	/** Перемещает файл или папку в корзину с возможностью переименования. */
	fun moveItemWithVersioning(sourcePath: String, targetDir: File, sourceBaseDir: File, targetRelativePath: String): Boolean {
		val sourceFile = File(sourcePath)
		if (!sourceFile.exists()) return false
		val targetFile = targetDir.toPath().resolve(targetRelativePath).toFile()
		targetFile.parentFile?.mkdirs()
		return try {
			if (sourceFile.isDirectory) {
				sourceFile.copyRecursively(targetFile, overwrite = true)
				sourceFile.deleteRecursively()
			} else {
				sourceFile.copyTo(targetFile, overwrite = true)
				sourceFile.delete()
			}
			true
		} catch (e: Exception) {
			logger.error("Ошибка перемещения с версионированием: ${e.message}")
			false
		}
	}
	
	// ================== ВОССТАНОВЛЕНИЕ ==================
	
	/**
	 * Восстанавливает файл из корзины по идентификатору удалённой записи.
	 * Файл перемещается обратно на оригинальный путь, флаг isDeleted снимается.
	 */
	@Transactional
	fun restoreFile(deletedFileId: Long, currentUser: CurrentUser): Boolean {
		val deleted = deletedFileRepository.findById(deletedFileId).orElseThrow {
			IllegalArgumentException("Запись об удалённом файле не найдена")
		}
		val fileEntity = deleted.fileEntity
		if (!fileEntity.isDeleted) throw IllegalStateException("Файл уже не удалён")
		
		val originalPath = deleted.originalPath
		val parentPath = Paths.get(originalPath).parent?.toString() ?: ""
		
		val permissions = checkAccessForDirectory(currentUser, parentPath)
		if ((permissions and AccessType.CREATE.value) == 0 && !currentUser.isAdmin) {
			throw SecurityException("Нет прав на восстановление в $parentPath")
		}
		
		val targetFile = getSafePath(originalPath).toFile()
		if (targetFile.exists()) {
			throw IllegalArgumentException("По оригинальному пути уже существует файл: $originalPath")
		}
		checkNotDeleted(originalPath)
		
		val sourcePath = findDeletedFilePath(deleted)
		if (!Files.exists(sourcePath)) {
			throw IllegalStateException("Файл в корзине не найден: $sourcePath")
		}
		
		targetFile.parentFile?.mkdirs()
		Files.move(sourcePath, targetFile.toPath(), StandardCopyOption.ATOMIC_MOVE)
		
		fileEntity.isDeleted = false
		fileEntityRepository.save(fileEntity)
		deletedFileRepository.delete(deleted)
		
		recordHistory("RESTORE", currentUser.userDetails!!, fileEntity = fileEntity,
			path = originalPath, isFile = true, details = "{\"version\": ${deleted.version}}")
		
		logger.info("Файл восстановлен: $originalPath")
		return true
	}
	
	/**
	 * Восстанавливает папку и всё её содержимое из корзины.
	 * Восстанавливаются только те дочерние элементы, которые были удалены вместе с папкой.
	 */
	@Transactional
	fun restoreFolder(deletedFolderId: Long, currentUser: CurrentUser): Boolean {
		val deleted = deletedFolderRepository.findById(deletedFolderId).orElseThrow {
			IllegalArgumentException("Запись об удалённой папке не найдена")
		}
		val folderEntity = deleted.folderEntity
		if (!folderEntity.isDeleted) throw IllegalStateException("Папка уже не удалена")
		
		val originalPath = deleted.originalPath
		val parentPath = Paths.get(originalPath).parent?.toString() ?: ""
		
		val permissions = checkAccessForDirectory(currentUser, parentPath)
		if ((permissions and AccessType.CREATE.value) == 0 && !currentUser.isAdmin) {
			throw SecurityException("Нет прав на восстановление в $parentPath")
		}
		
		val targetFolder = getSafePath(originalPath).toFile()
		if (targetFolder.exists()) {
			throw IllegalArgumentException("По оригинальному пути уже существует папка: $originalPath")
		}
		checkNotDeleted(originalPath)
		
		val sourcePath = findDeletedFolderPath(deleted)
		if (!Files.exists(sourcePath)) {
			throw IllegalStateException("Папка в корзине не найдена: $sourcePath")
		}
		
		targetFolder.parentFile?.mkdirs()
		Files.move(sourcePath, targetFolder.toPath(), StandardCopyOption.ATOMIC_MOVE)
		
		folderEntity.isDeleted = false
		folderEntityRepository.save(folderEntity)
		restoreChildren(folderEntity, originalPath, currentUser)
		
		deletedFolderRepository.delete(deleted)
		
		recordHistory("RESTORE", currentUser.userDetails!!, folderEntity = folderEntity,
			path = originalPath, isFile = false, details = "{\"version\": ${deleted.version}}")
		
		logger.info("Папка восстановлена: $originalPath")
		return true
	}
	
	/** Рекурсивно снимает флаг isDeleted со всех дочерних файлов и папок. */
	private fun restoreChildren(folder: FolderEntity, basePath: String, currentUser: CurrentUser) {
		val childrenFiles = fileEntityRepository.findByPathStartingWith(basePath + "/")
		childrenFiles.forEach { file ->
			if (file.isDeleted) {
				file.isDeleted = false
				fileEntityRepository.save(file)
			}
		}
		val childrenFolders = folderEntityRepository.findByPathStartingWith(basePath + "/")
		childrenFolders.forEach { childFolder ->
			if (childFolder.isDeleted) {
				childFolder.isDeleted = false
				folderEntityRepository.save(childFolder)
				restoreChildren(childFolder, childFolder.path, currentUser)
			}
		}
	}
	
	/** Находит физический путь к удалённому файлу в корзине по записи DeletedFile. */
	fun findDeletedFilePath(deleted: DeletedFile): Path {
		val originalPath = deleted.originalPath
		val version = deleted.version
		val baseName = Paths.get(originalPath).fileName.toString()
		val parentDir = Paths.get(originalPath).parent?.toString() ?: ""
		val pattern = "${baseName}_v${version}_\\d+.*"
		val dir = safeRootPathDeleted.resolve(parentDir).toFile()
		val found = dir.listFiles { _, name -> name.matches(Regex(pattern)) }
		return found?.firstOrNull()?.toPath() ?: safeRootPathDeleted.resolve(originalPath)
	}
	
	/** Находит физический путь к удалённой папке в корзине по записи DeletedFolder. */
	fun findDeletedFolderPath(deleted: DeletedFolder): Path {
		val originalPath = deleted.originalPath
		val version = deleted.version
		val folderName = Paths.get(originalPath).fileName.toString()
		val parentDir = Paths.get(originalPath).parent?.toString() ?: ""
		val pattern = "${folderName}_v${version}_\\d+"
		val dir = safeRootPathDeleted.resolve(parentDir).toFile()
		val found = dir.listFiles { _, name -> name.matches(Regex(pattern)) }
		return found?.firstOrNull()?.toPath() ?: safeRootPathDeleted.resolve(originalPath)
	}
	
	// ================== ОКОНЧАТЕЛЬНОЕ УДАЛЕНИЕ ==================
	
	/**
	 * Окончательно удаляет файл (только для администратора).
	 * Физический файл удаляется, сущность и права удаляются из БД,
	 * в истории ссылка на сущность обнуляется.
	 */
	@Transactional
	fun permanentDeleteFile(deletedFileId: Long, currentUser: CurrentUser) {
		if (!currentUser.isAdmin) throw SecurityException("Только администратор может удалять файлы окончательно")
		val deleted = deletedFileRepository.findById(deletedFileId).orElseThrow()
		val fileEntity = deleted.fileEntity
		
		val sourcePath = findDeletedFilePath(deleted)
		Files.deleteIfExists(sourcePath)
		
		workHistoryRepository.findAll().filter { it.fileEntity?.id == fileEntity.id }.forEach {
			it.fileEntity = null
			workHistoryRepository.save(it)
		}
		
		filePermissionRepository.deleteAll(filePermissionRepository.findByFileEntity(fileEntity))
		fileEntityRepository.delete(fileEntity)
		deletedFileRepository.delete(deleted)
		
		logger.info("Файл окончательно удалён: ${deleted.originalPath}")
	}
	
	/** Окончательно удаляет папку (только для администратора). */
	@Transactional
	fun permanentDeleteFolder(deletedFolderId: Long, currentUser: CurrentUser) {
		if (!currentUser.isAdmin) throw SecurityException("Только администратор может удалять папки окончательно")
		val deleted = deletedFolderRepository.findById(deletedFolderId).orElseThrow()
		val folderEntity = deleted.folderEntity
		
		val sourcePath = findDeletedFolderPath(deleted)
		sourcePath.toFile().deleteRecursively()
		
		workHistoryRepository.findAll().filter { it.folderEntity?.id == folderEntity.id }.forEach {
			it.folderEntity = null
			workHistoryRepository.save(it)
		}
		
		folderPermissionRepository.deleteAll(folderPermissionRepository.findByFolderEntity(folderEntity))
		folderEntityRepository.delete(folderEntity)
		deletedFolderRepository.delete(deleted)
		
		logger.info("Папка окончательно удалена: ${deleted.originalPath}")
	}
	
	// ================== УПРАВЛЕНИЕ ПРАВАМИ ==================
	
	/**
	 * Устанавливает или обновляет явное разрешение для папки.
	 * @param path путь к папке
	 * @param userId идентификатор пользователя (если указан, groupId должен быть null)
	 * @param groupId идентификатор группы (если указан, userId должен быть null)
	 * @param mode битовая маска прав (0-15)
	 */
	@Transactional
	fun setFolderPermission(
		path: String,
		userId: Int?,
		groupId: Int?,
		mode: Int,
		currentUser: CurrentUser
	) {
		require((userId != null) xor (groupId != null)) { "Укажите ровно одно: userId или groupId" }
		val permissions = checkAccessForDirectory(currentUser, path)
		if ((permissions and AccessType.UPDATE.value) == 0) {
			throw SecurityException("Нет прав на изменение разрешений для '$path'")
		}
		validateMode(mode)
		
		val folderEntity = folderEntityRepository.findByPath(path)
			?: throw EntityNotFoundException("Папка не найдена: $path")
		
		val user = userId?.let { userService.getUserEntityById(it) }
		val group = groupId?.let { groupService.read(it) ?: throw EntityNotFoundException("Группа не найдена") }
		
		val existing = if (user != null) {
			folderPermissionRepository.findByFolderEntityAndUser(folderEntity, user)
		} else {
			folderPermissionRepository.findByFolderEntityAndGroup(folderEntity, group!!)
		}
		
		if (existing != null) {
			existing.mode = mode.toShort()
			folderPermissionRepository.save(existing)
		} else {
			folderPermissionRepository.save(FolderPermission(folderEntity, user, group, mode.toShort()))
		}
		
		recordHistory("CHANGE_PERMISSIONS", currentUser.userDetails!!,
			folderEntity = folderEntity, path = path, isFile = false,
			details = "{\"mode\": $mode, \"userId\": $userId, \"groupId\": $groupId}")
	}
	
	/** Удаляет явное разрешение для папки. */
	@Transactional
	fun deleteFolderPermission(permissionId: Long, currentUser: CurrentUser) {
		val perm = folderPermissionRepository.findById(permissionId).orElseThrow()
		val path = perm.folderEntity.path
		val permissions = checkAccessForDirectory(currentUser, path)
		if ((permissions and AccessType.UPDATE.value) == 0) {
			throw SecurityException("Нет прав на изменение разрешений для '$path'")
		}
		folderPermissionRepository.delete(perm)
		recordHistory("CHANGE_PERMISSIONS", currentUser.userDetails!!,
			folderEntity = perm.folderEntity, path = path, isFile = false,
			details = "{\"action\": \"delete\", \"permissionId\": $permissionId}")
	}
	
	/** Устанавливает или обновляет явное разрешение для файла. */
	@Transactional
	fun setFilePermission(
		path: String,
		userId: Int?,
		groupId: Int?,
		mode: Int,
		currentUser: CurrentUser
	) {
		require((userId != null) xor (groupId != null)) { "Укажите ровно одно: userId или groupId" }
		val fileEntity = fileEntityRepository.findByPath(path)
			?: throw EntityNotFoundException("Файл не найден: $path")
		val parentPath = Paths.get(path).parent?.toString() ?: ""
		val permissions = checkAccessForDirectory(currentUser, parentPath)
		if ((permissions and AccessType.UPDATE.value) == 0) {
			throw SecurityException("Нет прав на изменение разрешений для '$path'")
		}
		validateMode(mode)
		
		val user = userId?.let { userService.getUserEntityById(it) }
		val group = groupId?.let { groupService.read(it) ?: throw EntityNotFoundException("Группа не найдена") }
		
		val existing = if (user != null) {
			filePermissionRepository.findByFileEntityAndUser(fileEntity, user)
		} else {
			filePermissionRepository.findByFileEntityAndGroup(fileEntity, group!!)
		}
		
		if (existing != null) {
			existing.mode = mode.toShort()
			filePermissionRepository.save(existing)
		} else {
			filePermissionRepository.save(FilePermission(fileEntity, user, group, mode.toShort()))
		}
		
		recordHistory("CHANGE_PERMISSIONS", currentUser.userDetails!!,
			fileEntity = fileEntity, path = path, isFile = true,
			details = "{\"mode\": $mode, \"userId\": $userId, \"groupId\": $groupId}")
	}
	
	/** Удаляет явное разрешение для файла. */
	@Transactional
	fun deleteFilePermission(permissionId: Long, currentUser: CurrentUser) {
		val perm = filePermissionRepository.findById(permissionId).orElseThrow()
		val path = perm.fileEntity.path
		val parentPath = Paths.get(path).parent?.toString() ?: ""
		val permissions = checkAccessForDirectory(currentUser, parentPath)
		if ((permissions and AccessType.UPDATE.value) == 0) {
			throw SecurityException("Нет прав на изменение разрешений для '$path'")
		}
		filePermissionRepository.delete(perm)
		recordHistory("CHANGE_PERMISSIONS", currentUser.userDetails!!,
			fileEntity = perm.fileEntity, path = path, isFile = true,
			details = "{\"action\": \"delete\", \"permissionId\": $permissionId}")
	}
	
	/** Проверяет, что маска прав находится в допустимом диапазоне и содержит READ, если не NONE. */
	private fun validateMode(mode: Int) {
		if (mode !in 0..AccessType.ALL.value) throw IllegalArgumentException("Недопустимое значение прав (0-15)")
		if ((mode and AccessType.READ.value) == 0 && mode != 0) {
			throw IllegalArgumentException("Нельзя выдать права без разрешения на чтение")
		}
	}
	
	// ================== ПОЛУЧЕНИЕ УДАЛЁННЫХ ==================
	
	/**
	 * Возвращает список удалённых файлов, доступных текущему пользователю.
	 * Администратор видит все, обычный пользователь — только свои или из своих групп.
	 */
	fun getDeletedFilesForUser(currentUser: CurrentUser): List<DeletedFileInfo> {
		val all = deletedFileRepository.findAllOrderByDeletedAtDesc()
		return all.filter { df ->
			currentUser.isAdmin || df.deletedByUser.id == currentUser.id ||
					(isGroupPath(df.originalPath) && groupService.hasUserAccessToGroup(currentUser.id!!, extractGroupFromPath(df.originalPath)!!))
		}.map { df ->
			DeletedFileInfo(
				id = df.id!!,
				originalPath = df.originalPath,
				deletedAt = df.deletedAt,
				version = df.version,
				deletedByUserId = df.deletedByUser.id!!,
				deletedByUserEmail = df.deletedByUser.email
			)
		}
	}
	
	/** Возвращает список удалённых папок, доступных текущему пользователю. */
	fun getDeletedFoldersForUser(currentUser: CurrentUser): List<DeletedFolderInfo> {
		val all = deletedFolderRepository.findAllOrderByDeletedAtDesc()
		return all.filter { df ->
			currentUser.isAdmin || df.deletedByUser.id == currentUser.id ||
					(isGroupPath(df.originalPath) && groupService.hasUserAccessToGroup(currentUser.id!!, extractGroupFromPath(df.originalPath)!!))
		}.map { df ->
			DeletedFolderInfo(
				id = df.id!!,
				originalPath = df.originalPath,
				deletedAt = df.deletedAt,
				version = df.version,
				deletedByUserId = df.deletedByUser.id!!,
				deletedByUserEmail = df.deletedByUser.email
			)
		}
	}
	
	private fun isGroupPath(path: String): Boolean = path.startsWith("$groupsDir/")
	
	// ================== СКАЧИВАНИЕ ==================
	
	/**
	 * Скачивает файл с проверкой права READ.
	 * @return пара: файл и его MIME-тип.
	 */
	fun downloadFileByPermissions(currentUser: CurrentUser, relativePath: String): Pair<File, String> {
		val permissions = checkAccessForFile(currentUser,
			Paths.get(relativePath).parent?.toString() ?: "",
			Paths.get(relativePath).fileName.toString())
		if ((permissions and AccessType.READ.value) == 0) {
			throw SecurityException("Нет прав на чтение файла: $relativePath")
		}
		val file = getSafePath(relativePath).toFile()
		if (!file.exists() || file.isDirectory) throw IllegalArgumentException("Файл не найден")
		return Pair(file, getContentType(file))
	}
	
	// ================== ПОИСК ==================
	
	/**
	 * Рекурсивно ищет файлы и папки по подстроке в имени, учитывая права доступа.
	 */
	fun searchFilesAndFoldersByPermissions(currentUser: CurrentUser, query: String, basePath: String): Pair<List<FileInfo>, List<FolderInfo>> {
		val dirPerm = checkAccessForDirectory(currentUser, basePath)
		if ((dirPerm and AccessType.READ.value) == 0) throw SecurityException("Нет прав на поиск в $basePath")
		
		val directory = getSafePath(basePath).toFile()
		val filesList = mutableListOf<FileInfo>()
		val foldersList = mutableListOf<FolderInfo>()
		
		fun searchRecursively(currentDir: File) {
			currentDir.listFiles()?.forEach { file ->
				try {
					val relPath = getRelativePath(file.toPath())
					if (file.name.contains(query, ignoreCase = true)) {
						if (file.isFile) {
							val perm = checkAccessForFile(currentUser, relPath.substringBeforeLast("/"), file.name)
							if ((perm and AccessType.READ.value) != 0) filesList.add(createFileInfo(file))
						} else {
							val perm = checkAccessForDirectory(currentUser, relPath)
							if ((perm and AccessType.READ.value) != 0) foldersList.add(createFolderInfo(file))
						}
					}
					if (file.isDirectory) {
						searchRecursively(file)
					}
				} catch (e: SecurityException) { /* skip */ }
			}
		}
		searchRecursively(directory)
		return Pair(filesList, foldersList)
	}
	
	/** Проверяет существование пути и наличие права READ у пользователя. */
	fun pathExistsByPermissions(currentUser: CurrentUser, relativePath: String): Boolean {
		val file = getSafePath(relativePath).toFile()
		if (!file.exists()) return false
		return if (file.isDirectory) {
			(checkAccessForDirectory(currentUser, relativePath) and AccessType.READ.value) != 0
		} else {
			(checkAccessForFile(currentUser, relativePath.substringBeforeLast("/"), file.name) and AccessType.READ.value) != 0
		}
	}
	
	// ================== ГРУППОВЫЕ ПАПКИ ==================
	
	/** Создаёт папку для новой группы. */
	fun createGroupFolder(groupName: String) {
		val safeName = sanitizeFileName(groupName)
		val dirPath = safeRootPath.resolve(groupsDir).resolve(safeName)
		Files.createDirectories(dirPath)
		val folderEntity = FolderEntity(path = "$groupsDir/$safeName", isDeleted = false)
		folderEntityRepository.save(folderEntity)
		logger.info("Создана папка группы: $groupName")
	}
	
	/** Перемещает папку группы в корзину (при удалении группы). */
	fun deleteGroupFolder(groupName: String) {
		val safeName = sanitizeFileName(groupName)
		val folderPath = "$groupsDir/$safeName"
		val folderEntity = folderEntityRepository.findByPath(folderPath) ?: return
		folderEntity.isDeleted = true
		folderEntityRepository.save(folderEntity)
		val source = safeRootPath.resolve(groupsDir).resolve(safeName).toFile()
		if (source.exists()) {
			moveItemWithVersioning(source.absolutePath, safeRootPathDeleted.toFile(), safeRootPath.toFile(),
				generateDeletedFolderPath(folderPath, System.currentTimeMillis(), 1))
		}
		logger.info("Папка группы $groupName перемещена в корзину")
	}
	
	/** Переименовывает папку группы при изменении имени группы. */
	fun moveGroupFolder(oldGroupName: String, newGroupName: String): Boolean {
		val safeOld = sanitizeFileName(oldGroupName)
		val safeNew = sanitizeFileName(newGroupName)
		val oldPath = safeRootPath.resolve(groupsDir).resolve(safeOld)
		val newPath = safeRootPath.resolve(groupsDir).resolve(safeNew)
		if (!Files.exists(oldPath)) return false
		Files.move(oldPath, newPath, StandardCopyOption.ATOMIC_MOVE)
		val oldFolderPath = "$groupsDir/$safeOld"
		val newFolderPath = "$groupsDir/$safeNew"
		val folderEntity = folderEntityRepository.findByPath(oldFolderPath)
		folderEntity?.let {
			it.path = newFolderPath
			folderEntityRepository.save(it)
		}
		return true
	}
	
	// ================== ИСТОРИЯ ==================
	
	/**
	 * Записывает событие в историю операций.
	 * @param operationName имя типа операции (должно существовать в таблице OperationType)
	 */
	private fun recordHistory(
		operationName: String,
		user: User,
		fileEntity: FileEntity? = null,
		folderEntity: FolderEntity? = null,
		path: String,
		isFile: Boolean,
		details: String? = null
	) {
		val operationType = operationTypeRepository.findByName(operationName)
			?: throw IllegalStateException("OperationType $operationName not found")
		val history = WorkHistory(
			operationType = operationType,
			user = user,
			fileEntity = fileEntity,
			folderEntity = folderEntity,
			path = path,
			isFile = isFile,
			details = details
		)
		workHistoryRepository.save(history)
	}
	
	/**
	 * Возвращает отфильтрованный список записей истории.
	 * @param filters фильтры по пользователю, префиксу пути и типу (файл/папка)
	 */
	fun getWorkHistory(filters: HistoryFilter): List<WorkHistory> {
		return workHistoryRepository.findAll().filter { wh ->
			(filters.userId == null || wh.user.id == filters.userId) &&
					(filters.pathPrefix == null || wh.path.startsWith(filters.pathPrefix)) &&
					(filters.isFile == null || wh.isFile == filters.isFile)
		}
	}
	
	/** Параметры фильтрации истории. */
	data class HistoryFilter(
		val userId: Int? = null,
		val pathPrefix: String? = null,
		val isFile: Boolean? = null
	)
	
	// ================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ==================
	
	/** Создаёт DTO с информацией о файле. */
	private fun createFileInfo(file: File): FileInfo {
		val attributes = Files.readAttributes(file.toPath(), BasicFileAttributes::class.java)
		return FileInfo(
			name = file.name,
			fullPath = getRelativePath(file.toPath()),
			lastModified = Date(attributes.lastModifiedTime().toMillis()),
			size = file.length(),
			extension = file.extension,
			readableSize = formatSize(file.length())
		)
	}
	
	/** Создаёт DTO с информацией о папке. */
	private fun createFolderInfo(folder: File): FolderInfo {
		val attributes = Files.readAttributes(folder.toPath(), BasicFileAttributes::class.java)
		val (size, itemCount) = calculateFolderSizeAndCount(folder)
		return FolderInfo(
			name = folder.name,
			fullPath = getRelativePath(folder.toPath()),
			lastModified = Date(attributes.lastModifiedTime().toMillis()),
			size = size,
			readableSize = formatSize(size),
			itemCount = itemCount
		)
	}
	
	/** Рекурсивно вычисляет суммарный размер и количество элементов в папке. */
	private fun calculateFolderSizeAndCount(folder: File): Pair<Long, Int> {
		var size = 0L
		var count = 0
		folder.listFiles()?.forEach {
			if (it.isFile) { size += it.length(); count++ }
			else if (it.isDirectory) {
				val (s, c) = calculateFolderSizeAndCount(it)
				size += s; count += c + 1
			}
		}
		return Pair(size, count)
	}
	
	/** Форматирует размер в байтах в читаемый вид (B, KB, MB, ...). */
	private fun formatSize(size: Long): String {
		if (size <= 0) return "0 B"
		val units = arrayOf("B", "KB", "MB", "GB", "TB")
		var s = size.toDouble()
		var i = 0
		while (s >= 1024 && i < units.size - 1) { s /= 1024; i++ }
		return "%.2f %s".format(Locale.US, s, units[i])
	}
	
	/** Определяет MIME-тип файла по расширению. */
	private fun getContentType(file: File): String {
		return when (file.extension.lowercase()) {
			"pdf" -> "application/pdf"
			"txt" -> "text/plain"
			"jpg", "jpeg" -> "image/jpeg"
			"png" -> "image/png"
			"mp4" -> "video/mp4"
			"mp3" -> "audio/mpeg"
			else -> "application/octet-stream"
		}
	}
}