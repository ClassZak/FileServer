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
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.nio.file.StandardCopyOption
import java.nio.file.attribute.BasicFileAttributes
import java.time.LocalDateTime
import java.util.*
import kotlin.io.path.Path
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
	val originalPath: String,
	val deletedAt: LocalDateTime,
	val version: Int,
	val deletedByUserEmail: String
)

/**
 * Информация об удалённой папке для передачи клиенту.
 */
data class DeletedFolderInfo(
	val originalPath: String,
	val deletedAt: LocalDateTime,
	val version: Int,
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
			throw IllegalStateException("Файл '${file.path}' был ранее удалён")
		}
		val folder = folderEntityRepository.findByPath(path)
		if (folder != null && folder.isDeleted) {
			throw IllegalStateException("Папка '${folder.path}' была ранее удалена")
		}
	}
	
	// ================== ПРОВЕРКА ПРАВ ==================
	
	/**
	 * Проверяет, что путь свободен для восстановления:
	 * - физический файл/папка не должны существовать
	 * - в БД не должно быть активной (isDeleted = false) записи
	 * Удалённые записи (isDeleted = true) допустимы.
	 */
	private fun checkPathNotOccupied(path: String) {
		val target = getSafePath(path).toFile()
		if (target.exists()) {
			throw IllegalStateException("Невозможно восстановить: по пути '$path' уже существует файл или папка")
		}
		val file = fileEntityRepository.findByPath(path)
		if (file != null && !file.isDeleted) {
			throw IllegalStateException("Невозможно восстановить: файл '$path' уже активен в системе")
		}
		val folder = folderEntityRepository.findByPath(path)
		if (folder != null && !folder.isDeleted) {
			throw IllegalStateException("Невозможно восстановить: папка '$path' уже активна в системе")
		}
	}
	
	/**
	 * Вычисляет эффективные права доступа текущего пользователя к директории.
	 * Алгоритм:
	 * - Администратор всегда имеет полный доступ.
	 * - Для пустого пути (корень) не-админ получает READ.
	 * - Папка `groups` доступна только на чтение.
	 * - Для групповых папок (`groups/groupName/...`) участники группы по умолчанию имеют ALL,
	 * который может быть переопределён явными разрешениями в `FolderPermission`.
	 * - Для остальных путей права вычисляются как побитовое ИЛИ всех разрешений,
	 * найденных для текущего пользователя и его групп вдоль всей иерархии папок.
	 *
	 * @param currentUser аутентифицированный пользователь
	 * @param path относительный путь к директории
	 * @return битовая маска разрешённых операций (Int)
	 */
	fun checkAccessForDirectory(currentUser: CurrentUser, path: String): Int {
		if (currentUser.isAdmin) return AccessType.ALL.value
		
		val safePath = getRelativePath(getSafePath(path))
		val userId = currentUser.id!!
		
		if (safePath.isEmpty()) return AccessType.READ.value
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
	 *
	 * @param currentUser аутентифицированный пользователь
	 * @param path относительный путь к родительской директории
	 * @param fileName имя файла
	 * @return битовая маска разрешённых операций (Int)
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
	/** Проверяет, является ли путь папкой внутри директории `groups` (/groups/<group_name>). */
	private fun isGroupRootDirectory(path: String): Boolean =
		path.startsWith("$groupsDir/") and (path.count { it == '/' } == 1)
	
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
	 *
	 * @param currentUser аутентифицированный пользователь
	 * @param relativePath относительный путь к директории
	 * @return пара: список файлов и список папок
	 * @throws SecurityException если нет прав на чтение директории
	 * @throws IllegalArgumentException если директория не существует
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
	 *
	 * @param currentUser аутентифицированный пользователь
	 * @param relativePath относительный путь к родительской директории
	 * @param folderName имя новой папки
	 * @return информация о созданной папке
	 * @throws SecurityException если нет права CREATE
	 * @throws IllegalArgumentException если родительская директория не найдена или папка уже существует
	 * @throws IllegalStateException если папка была ранее удалена или не удалось создать физическую папку
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
		recordHistory("CREATE", currentUser.userDetails!!, folderEntity = folderEntity, path = folderPath, isFile = false)
		logger.info("Папка создана: $folderPath")
		return createFolderInfo(newFolder)
	}
	
	// ================== ЗАГРУЗКА ФАЙЛА ==================
	
	/**
	 * Загружает файл в указанную директорию с проверкой прав, созданием сущности и записью в историю.
	 *
	 * @param currentUser аутентифицированный пользователь
	 * @param relativePath относительный путь к целевой директории
	 * @param file загружаемый файл
	 * @return информация о загруженном файле
	 * @throws SecurityException если нет права CREATE
	 * @throws IllegalArgumentException если целевая директория не найдена или файл уже существует
	 * @throws IllegalStateException если файл был ранее удалён
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
		recordHistory("UPLOAD", currentUser.userDetails!!, fileEntity = fileEntity, path = filePath, isFile = true)
		logger.info("Файл загружен: $filePath")
		return createFileInfo(targetFile)
	}
	
	// ================== УДАЛЕНИЕ В КОРЗИНУ С ВЕРСИОНИРОВАНИЕМ ==================
	
	/**
	 * Перемещает файл или папку в корзину с сохранением версии.
	 * Для файлов/папок, удаляемых повторно, увеличивается номер версии,
	 * а в корзине создаётся копия с именем, содержащим `_v{version}_{timestamp}`.
	 *
	 * @param currentUser аутентифицированный пользователь
	 * @param relativePath путь к удаляемому элементу
	 * @return true в случае успеха
	 * @throws IllegalArgumentException если элемент не найден
	 * @throws SecurityException если нет прав на удаление или попытка удалить папку групп
	 * @throws EntityNotFoundException если сущность не найдена в БД
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
			val deletedFile = DeletedFile(fileEntity = entity, originalPath = relativePath, deletedByUser = user, version = version)
			deletedFileRepository.save(deletedFile)
			recordHistory("DELETE", user, fileEntity = entity, path = relativePath, isFile = true,
				details = "{\"version\": $version, \"deletedPath\": \"$deletedRelativePath\"}")
		} else {
			entity as FolderEntity
			entity.isDeleted = true
			folderEntityRepository.save(entity)
			val deletedFolder = DeletedFolder(folderEntity = entity, originalPath = relativePath, deletedByUser = user, version = version)
			deletedFolderRepository.save(deletedFolder)
			recordHistory("DELETE", user, folderEntity = entity, path = relativePath, isFile = false,
				details = "{\"version\": $version, \"deletedPath\": \"$deletedRelativePath\"}")
		}
		
		logger.info("Перемещено в корзину: $relativePath -> $deletedRelativePath (v$version)")
		return true
	}
	
	/**
	 * Генерирует путь для удалённого файла с меткой версии и временной меткой.
	 * Формат: `{nameWithoutExt}_v{version}_{timestamp}{ext}`
	 *
	 * @param originalPath оригинальный путь файла
	 * @param timestamp временная метка удаления
	 * @param version номер версии
	 * @return путь к удалённому файлу в корзине
	 */
	fun generateDeletedFilePath(originalPath: String, timestamp: Long, version: Int): String {
		val baseName = Paths.get(originalPath).fileName.toString()
		val nameWithoutExt = baseName.substringBeforeLast(".")
		val ext = if (baseName.contains(".")) ".${baseName.substringAfterLast(".")}" else ""
		val parentDir = Paths.get(originalPath).parent?.toString() ?: ""
		val newName = "${nameWithoutExt}_v${version}_$timestamp$ext"
		return if (parentDir.isEmpty()) newName else "$parentDir/$newName"
	}
	
	/**
	 * Генерирует путь для удалённой папки с меткой версии и временной меткой.
	 * Формат: `{folderName}_v{version}_{timestamp}`
	 *
	 * @param originalPath оригинальный путь папки
	 * @param timestamp временная метка удаления
	 * @param version номер версии
	 * @return путь к удалённой папке в корзине
	 */
	fun generateDeletedFolderPath(originalPath: String, timestamp: Long, version: Int): String {
		val folderName = Paths.get(originalPath).fileName.toString()
		val parentDir = Paths.get(originalPath).parent?.toString() ?: ""
		val newName = "${folderName}_v${version}_$timestamp"
		return if (parentDir.isEmpty()) newName else "$parentDir/$newName"
	}
	
	/**
	 * Перемещает файл или папку в корзину с возможностью переименования.
	 *
	 * @param sourcePath исходный абсолютный путь
	 * @param targetDir целевая директория (корзина)
	 * @param sourceBaseDir базовая директория исходных файлов
	 * @param targetRelativePath относительный путь внутри корзины
	 * @return true в случае успешного перемещения, false при ошибке
	 */
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
	 * Восстанавливает файл из корзины по оригинальному пути и версии.
	 * Файл перемещается обратно на оригинальный путь, флаг isDeleted снимается,
	 * все версии удалённого файла физически удаляются.
	 *
	 * @param currentUser аутентифицированный пользователь
	 * @param originalPath оригинальный путь файла
	 * @param version версия для восстановления
	 * @return true в случае успеха
	 * @throws IllegalArgumentException если запись об удалённом файле не найдена или путь уже занят
	 * @throws IllegalStateException если файл не удалён или физический файл отсутствует в корзине
	 * @throws SecurityException если нет прав на восстановление
	 */
	@Transactional
	fun restoreFile(currentUser: CurrentUser, originalPath: String, version: Int): Boolean {
		val fileEntity = fileEntityRepository.findByPath(originalPath)
			?: throw IllegalArgumentException("Запись об удалённом файле не найдена")
		if (!fileEntity.isDeleted)
			throw IllegalStateException("Файл не удалён для его восстановления")
		val selectedDeleted = deletedFileRepository.findByFileEntityAndVersion(fileEntity, version)
			?: throw IllegalArgumentException("Запись об удалённом файле с версией $version не найдена")
		
		val parentPath = Paths.get(originalPath).parent?.toString() ?: ""
		
		val permissions = checkAccessForDirectory(currentUser, parentPath)
		if ((permissions and AccessType.CREATE.value) == 0 && !currentUser.isAdmin) {
			throw SecurityException("Нет прав на восстановление в $parentPath")
		}
		
		val targetFile = getSafePath(originalPath).toFile()
		if (targetFile.exists()) {
			throw IllegalArgumentException("По оригинальному пути уже существует файл: $originalPath")
		}
		checkPathNotOccupied(originalPath)
		
		// Получаем все удалённые версии этого файла
		val allDeletedVersions = deletedFileRepository.findByOriginalPath(originalPath)
		// Физически удаляем все версии из корзины
		allDeletedVersions.forEach { df ->
			val sourcePath = findDeletedFilePath(df)
			Files.deleteIfExists(sourcePath)
		}
		// Перемещаем выбранную версию на место (она всё ещё в корзине? На самом деле нужно переместить физический файл)
		val sourcePath = findDeletedFilePath(selectedDeleted)
		if (!Files.exists(sourcePath)) {
			throw IllegalStateException("Файл в корзине не найден: $sourcePath")
		}
		
		targetFile.parentFile?.mkdirs()
		Files.move(sourcePath, targetFile.toPath(), StandardCopyOption.ATOMIC_MOVE)
		
		// Удаляем все записи DeletedFile для этого файла
		deletedFileRepository.deleteAll(allDeletedVersions)
		
		fileEntity.isDeleted = false
		fileEntityRepository.save(fileEntity)
		
		recordHistory("RESTORE", currentUser.userDetails!!, fileEntity = fileEntity,
			path = originalPath, isFile = true, details = "{\"version\": $version}")
		
		logger.info("Файл восстановлен: $originalPath (версия $version)")
		return true
	}
	
	/**
	 * Восстанавливает папку и всё её содержимое из корзины по оригинальному пути и версии.
	 * Папка перемещается обратно, все версии удалённой папки физически удаляются.
	 * Содержимое БД синхронизируется с фактическим содержимым восстановленной директории.
	 *
	 * @param currentUser аутентифицированный пользователь
	 * @param originalPath оригинальный путь папки
	 * @param version версия для восстановления
	 * @return true в случае успеха
	 * @throws IllegalArgumentException если запись об удалённой папке не найдена или путь уже занят
	 * @throws IllegalStateException если папка не удалена или физическая папка отсутствует в корзине
	 * @throws SecurityException если нет прав на восстановление
	 */
	@Transactional
	fun restoreFolder(currentUser: CurrentUser, originalPath: String, version: Int): Boolean {
		val folderEntity = folderEntityRepository.findByPath(originalPath)
			?: throw IllegalArgumentException("Запись об удалённой папке не найдена")
		if (!folderEntity.isDeleted)
			throw IllegalStateException("Папка не удалена для её восстановления")
		val selectedDeleted = deletedFolderRepository.findByFolderEntityAndVersion(folderEntity, version)
			?: throw IllegalArgumentException("Запись об удалённой папке с версией $version не найдена")
		
		val parentPath = Paths.get(originalPath).parent?.toString() ?: ""
		
		val permissions = checkAccessForDirectory(currentUser, parentPath)
		if ((permissions and AccessType.CREATE.value) == 0 && !currentUser.isAdmin) {
			throw SecurityException("Нет прав на восстановление в $parentPath")
		}
		
		val targetFolder = getSafePath(originalPath).toFile()
		if (targetFolder.exists()) {
			throw IllegalArgumentException("По оригинальному пути уже существует папка: $originalPath")
		}
		checkPathNotOccupied(originalPath)
		
		// Получаем все удалённые версии этой папки
		val allDeletedVersions = deletedFolderRepository.findByOriginalPath(originalPath)
		// Физически удаляем все версии из корзины, кроме выбранной (её мы переместим)
		val sourcePath = findDeletedFolderPath(selectedDeleted)
		if (!Files.exists(sourcePath)) {
			throw IllegalStateException("Папка в корзине не найдена: $sourcePath")
		}
		
		targetFolder.parentFile?.mkdirs()
		Files.move(sourcePath, targetFolder.toPath(), StandardCopyOption.ATOMIC_MOVE)
		
		// Удаляем остальные физические версии
		allDeletedVersions.filter { it.id != selectedDeleted.id }.forEach { df ->
			val otherPath = findDeletedFolderPath(df)
			otherPath.toFile().deleteRecursively()
		}
		
		// Удаляем все записи DeletedFolder для этой папки
		deletedFolderRepository.deleteAll(allDeletedVersions)
		
		folderEntity.isDeleted = false
		folderEntityRepository.save(folderEntity)
		
		// Синхронизируем БД с фактическим содержимым восстановленной папки
		syncFolderContentsAfterRestore(originalPath)
		
		recordHistory("RESTORE", currentUser.userDetails!!, folderEntity = folderEntity,
			path = originalPath, isFile = false, details = "{\"version\": $version}")
		
		logger.info("Папка восстановлена: $originalPath (версия $version)")
		return true
	}
	
	private fun syncFolderContentsAfterRestore(folderPath: String) {
		val targetDir = getSafePath(folderPath).toFile()
		if (!targetDir.exists()) return
		
		targetDir.walkTopDown().forEach { file ->
			if (file == targetDir) return@forEach
			val relPath = getRelativePath(file.toPath())
			if (file.isFile) {
				var fileEntity = fileEntityRepository.findByPath(relPath)
				if (fileEntity == null) {
					fileEntity = FileEntity(path = relPath, isDeleted = false)
					fileEntityRepository.save(fileEntity)
				} else {
					if (fileEntity.isDeleted) {
						fileEntity.isDeleted = false
						fileEntityRepository.save(fileEntity)
					}
				}
				// Удаляем любые записи DeletedFile для этого файла (если были)
				deletedFileRepository.findByOriginalPath(relPath).forEach { deletedFileRepository.delete(it) }
			} else {
				var folderEntity = folderEntityRepository.findByPath(relPath)
				if (folderEntity == null) {
					folderEntity = FolderEntity(path = relPath, isDeleted = false)
					folderEntityRepository.save(folderEntity)
				} else {
					if (folderEntity.isDeleted) {
						folderEntity.isDeleted = false
						folderEntityRepository.save(folderEntity)
					}
				}
				deletedFolderRepository.findByOriginalPath(relPath).forEach { deletedFolderRepository.delete(it) }
			}
		}
	}
	
	/**
	 * Находит физический путь к удалённому файлу в корзине по записи DeletedFile.
	 * Использует регулярное выражение для поиска файла с именем `{baseName}_v{version}_*`.
	 *
	 * @param deleted запись об удалённом файле
	 * @return абсолютный путь к файлу в корзине */
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
	
	/**
	 * Находит физический путь к удалённой папке в корзине по записи DeletedFolder.
	 * Использует регулярное выражение для поиска папки с именем `{folderName}_v{version}_*`.
	 *
	 * @param deleted запись об удалённой папке
	 * @return абсолютный путь к папке в корзине
	 */
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
	 * Окончательно удаляет файл и все его версии (только для администратора).
	 * Физические файлы удаляются, сущность и права удаляются из БД,
	 * в истории ссылка на сущность обнуляется и добавляется текстовая информация.
	 *
	 * @param originalPath оригинальный путь файла
	 * @param currentUser текущий пользователь (должен быть администратором)
	 * @throws SecurityException если пользователь не администратор
	 * @throws EntityNotFoundException если файл не найден в БД
	 */
	@Transactional
	fun permanentDeleteFileByPath(originalPath: String, currentUser: CurrentUser) {
		if (!currentUser.isAdmin) throw SecurityException("Только администратор может удалять файлы окончательно")
		val fileEntity = fileEntityRepository.findByPath(originalPath)
			?: throw EntityNotFoundException("Файл с путём '$originalPath' не найден в БД")
		
		val deletedFiles = deletedFileRepository.findByOriginalPath(originalPath)
		deletedFiles.forEach { df ->
			val sourcePath = findDeletedFilePath(df)
			Files.deleteIfExists(sourcePath)
		}
		workHistoryRepository.findAll().filter { it.fileEntity?.id == fileEntity.id }.forEach { wh ->
			val newDetails = buildString {
				if (!wh.details.isNullOrBlank()) append(wh.details).append("; ")
				append("Файл окончательно удалён администратором. Путь: $originalPath")
			}
			wh.fileEntity = null
			wh.details = newDetails
			workHistoryRepository.save(wh)
		}
		filePermissionRepository.deleteAll(filePermissionRepository.findByFileEntity(fileEntity))
		deletedFileRepository.deleteAll(deletedFiles)
		fileEntityRepository.delete(fileEntity)
		logger.info("Файл '$originalPath' и все его версии окончательно удалены администратором ${currentUser.email}")
	}
	
	/**
	 * Окончательно удаляет папку и все её версии, включая все дочерние элементы (только для администратора).
	 * Физические папки и файлы удаляются, сущности и права удаляются из БД,
	 * в истории ссылки обнуляются.
	 *
	 * @param originalPath оригинальный путь папки
	 * @param currentUser текущий пользователь (должен быть администратором)
	 * @throws SecurityException если пользователь не администратор
	 * @throws EntityNotFoundException если папка не найдена в БД
	 */
	@Transactional
	fun permanentDeleteFolderByPath(originalPath: String, currentUser: CurrentUser) {
		if (!currentUser.isAdmin) throw SecurityException("Только администратор может удалять папки окончательно")
		val folderEntity = folderEntityRepository.findByPath(originalPath)
			?: throw EntityNotFoundException("Папка с путём '$originalPath' не найдена в БД")
		
		val deletedFolders = deletedFolderRepository.findByOriginalPath(originalPath)
		deletedFolders.forEach { df ->
			val sourcePath = findDeletedFolderPath(df)
			sourcePath.toFile().deleteRecursively()
		}
		workHistoryRepository.findAll().filter { it.folderEntity?.id == folderEntity.id }.forEach { wh ->
			val newDetails = buildString {
				if (!wh.details.isNullOrBlank()) append(wh.details).append("; ")
				append("Папка окончательно удалена администратором. Путь: $originalPath")
			}
			wh.folderEntity = null
			wh.details = newDetails
			workHistoryRepository.save(wh)
		}
		
		// Каскадное удаление дочерних элементов
		val childFiles = fileEntityRepository.findByPathStartingWith(originalPath + "/")
		childFiles.forEach { file ->
			filePermissionRepository.deleteAll(filePermissionRepository.findByFileEntity(file))
			deletedFileRepository.findByOriginalPath(file.path).forEach { deletedFileRepository.delete(it) }
			workHistoryRepository.findAll().filter { it.fileEntity?.id == file.id }.forEach { wh ->
				wh.fileEntity = null
				wh.details = (wh.details ?: "") + "; Удалён в составе папки $originalPath"
				workHistoryRepository.save(wh)
			}
			fileEntityRepository.delete(file)
		}
		
		val childFolders = folderEntityRepository.findByPathStartingWith(originalPath + "/")
		childFolders.forEach { folder ->
			folderPermissionRepository.deleteAll(folderPermissionRepository.findByFolderEntity(folder))
			deletedFolderRepository.findByOriginalPath(folder.path).forEach { deletedFolderRepository.delete(it) }
			workHistoryRepository.findAll().filter { it.folderEntity?.id == folder.id }.forEach { wh ->
				wh.folderEntity = null
				wh.details = (wh.details ?: "") + "; Удалена в составе папки $originalPath"
				workHistoryRepository.save(wh)
			}
			folderEntityRepository.delete(folder)
		}
		
		folderPermissionRepository.deleteAll(folderPermissionRepository.findByFolderEntity(folderEntity))
		deletedFolderRepository.deleteAll(deletedFolders)
		folderEntityRepository.delete(folderEntity)
		
		logger.info("Папка '$originalPath' и все её версии окончательно удалены администратором ${currentUser.email}")
	}
	
	// ================== УПРАВЛЕНИЕ ПРАВАМИ ==================
	
	/**
	 * Устанавливает или обновляет явное разрешение для папки.
	 *
	 * @param path путь к папке
	 * @param userId идентификатор пользователя (если указан, groupId должен быть null)
	 * @param groupId идентификатор группы (если указан, userId должен быть null)
	 * @param mode битовая маска прав (0-15)
	 * @param currentUser аутентифицированный пользователь
	 * @throws IllegalArgumentException если указаны оба или ни одного идентификатора
	 * @throws SecurityException если нет прав на изменение разрешений или попытка ограничить права группы в групповой папке
	 * @throws EntityNotFoundException если папка или субъект не найдены
	 */
	@Transactional
	fun setFolderPermission(path: String, userId: Int?, groupId: Int?, mode: Int, currentUser: CurrentUser) {
		require((userId != null) xor (groupId != null)) { "Укажите ровно одно: userId или groupId" }
		val permissions = checkAccessForDirectory(currentUser, path)
		if ((permissions and AccessType.UPDATE.value) == 0) {
			throw SecurityException("Нет прав на изменение разрешений для '$path'")
		}
		validateMode(mode)
		
		val folderEntity = folderEntityRepository.findByPath(path)
			?: throw EntityNotFoundException("Папка не найдена: $path")
		// Запрет на ограничение прав группы в групповой папке и создание прав для других групп в групповой папке
		if (groupId != null && isGroupDirectory(path))
			throw SecurityException("Группы должны иметь полный доступ к своим папкам. Путь '$path' принадлежит группе")
		
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
		recordHistory("CHANGE_PERMISSIONS", currentUser.userDetails!!, folderEntity = folderEntity, path = path, isFile = false,
			details = "{\"mode\": $mode, \"userId\": $userId, \"groupId\": $groupId}")
	}
	
	/**
	 * Удаляет явное разрешение для папки.
	 *
	 * @param permissionId идентификатор разрешения
	 * @param currentUser аутентифицированный пользователь
	 * @throws SecurityException если нет прав на изменение разрешений
	 * @throws EntityNotFoundException если разрешение не найдено
	 */
	@Transactional
	fun deleteFolderPermission(permissionId: Long, currentUser: CurrentUser) {
		val perm = folderPermissionRepository.findById(permissionId).orElseThrow()
		val path = perm.folderEntity.path
		val permissions = checkAccessForDirectory(currentUser, path)
		if ((permissions and AccessType.UPDATE.value) == 0) {
			throw SecurityException("Нет прав на изменение разрешений для '$path'")
		}
		folderPermissionRepository.delete(perm)
		recordHistory("CHANGE_PERMISSIONS", currentUser.userDetails!!, folderEntity = perm.folderEntity, path = path, isFile = false,
			details = "{\"action\": \"delete\", \"permissionId\": $permissionId}")
	}
	
	/**
	 * Устанавливает или обновляет явное разрешение для файла.
	 *
	 * @param path путь к файлу
	 * @param userId идентификатор пользователя (если указан, groupId должен быть null)
	 * @param groupId идентификатор группы (если указан, userId должен быть null)
	 * @param mode битовая маска прав (0-15)
	 * @param currentUser аутентифицированный пользователь
	 * @throws IllegalArgumentException если указаны оба или ни одного идентификатора
	 * @throws SecurityException если нет прав на изменение разрешений или попытка ограничить права группы в групповой папке
	 * @throws EntityNotFoundException если файл или субъект не найдены
	 */
	@Transactional
	fun setFilePermission(path: String, userId: Int?, groupId: Int?, mode: Int, currentUser: CurrentUser) {
		require((userId != null) xor (groupId != null)) { "Укажите ровно одно: userId или groupId" }
		val fileEntity = fileEntityRepository.findByPath(path)
			?: throw EntityNotFoundException("Файл не найден: $path")
		// Запрет на ограничение прав группы в групповой папке и создание прав для других групп в групповой папке
		if (groupId != null && isGroupDirectory(Paths.get(path).parent?.toString() ?: "")) {
			throw SecurityException("Нельзя ограничивать права группы на файлы внутри её папки")
		}
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
		recordHistory("CHANGE_PERMISSIONS", currentUser.userDetails!!, fileEntity = fileEntity, path = path, isFile = true,
			details = "{\"mode\": $mode, \"userId\": $userId, \"groupId\": $groupId}")
	}
	
	/**
	 * Удаляет явное разрешение для файла.
	 *
	 * @param permissionId идентификатор разрешения
	 * @param currentUser аутентифицированный пользователь
	 * @throws SecurityException если нет прав на изменение разрешений
	 * @throws EntityNotFoundException если разрешение не найдено
	 */
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
		recordHistory("CHANGE_PERMISSIONS", currentUser.userDetails!!, fileEntity = perm.fileEntity, path = path, isFile = true,
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
	 *
	 * @param currentUser аутентифицированный пользователь
	 * @return список DeletedFileInfo
	 */
	fun getDeletedFilesForUser(currentUser: CurrentUser): List<DeletedFileInfo> {
		val all = deletedFileRepository.findAllOrderByDeletedAtDesc()
		return all.filter { df ->
			currentUser.isAdmin || df.deletedByUser.id == currentUser.id ||
					(isGroupPath(df.originalPath) && groupService.hasUserAccessToGroup(currentUser.id!!, extractGroupFromPath(df.originalPath)!!))
		}.map { df ->
			DeletedFileInfo(
				originalPath = df.originalPath,
				deletedAt = df.deletedAt,
				version = df.version,
				deletedByUserEmail = df.deletedByUser.email
			)
		}
	}
	
	/**
	 * Возвращает список удалённых папок, доступных текущему пользователю.
	 * Администратор видит все, обычный пользователь — только свои или из своих групп.
	 *
	 * @param currentUser аутентифицированный пользователь
	 * @return список DeletedFolderInfo
	 * */
	fun getDeletedFoldersForUser(currentUser: CurrentUser): List<DeletedFolderInfo> {
		val all = deletedFolderRepository.findAllOrderByDeletedAtDesc()
		return all.filter { df ->
			currentUser.isAdmin || df.deletedByUser.id == currentUser.id ||
					(isGroupPath(df.originalPath) && groupService.hasUserAccessToGroup(currentUser.id!!, extractGroupFromPath(df.originalPath)!!))
		}.map { df ->
			DeletedFolderInfo(
				originalPath = df.originalPath,
				deletedAt = df.deletedAt,
				version = df.version,
				deletedByUserEmail = df.deletedByUser.email
			)
		}
	}
	
	// ================== ПОЛУЧЕНИЕ ВЕРСИЙ УДАЛЁННЫХ ФАЙЛОВ И ПАПОК ==================
	
	/**
	 * Возвращает список версий удалённого файла, доступных текущему пользователю.
	 * Администратор видит все, обычный пользователь — только свои или из своих групп.
	 *
	 * @param currentUser аутентифицированный пользователь
	 * @param parentPath родительская папка файла
	 * @param fileName имя файла
	 * @return список DeletedFileInfo
	 * @throws EntityNotFoundException если файл не найден или не был удалён
	 * @throws SecurityException если нет прав на чтение файла
	 */
	fun getDeletedFileVersionsForUser(currentUser: CurrentUser, parentPath: String, fileName: String): List<DeletedFileInfo> {
		val fullPath = Path(parentPath, fileName).toString()
		if (fileEntityRepository.findByPath(fullPath) == null)
			throw EntityNotFoundException("Файл '$fullPath' не найден")
		val permissions = checkAccessForFile(currentUser, parentPath, fileName)
		if ((permissions and AccessType.READ.value) == 0)
			throw SecurityException("Нет прав на чтение файла: $fullPath")
		
		
		val versions = deletedFileRepository.findByOriginalPath(fullPath)
		if (versions.isEmpty())
			throw EntityNotFoundException("Файл '$fullPath' не был удалён")
		return versions.filter { df ->
			currentUser.isAdmin || df.deletedByUser.id == currentUser.id ||
					(isGroupPath(df.originalPath) && groupService.hasUserAccessToGroup(currentUser.id!!, extractGroupFromPath(df.originalPath)!!))
		}.map { df ->
			DeletedFileInfo(
				originalPath = df.originalPath,
				deletedAt = df.deletedAt,
				version = df.version,
				deletedByUserEmail = df.deletedByUser.email
			)
		}
	}
	
	/**
	 * Возвращает список версий удалённой папки, доступных текущему пользователю.
	 * Администратор видит все, обычный пользователь — только свои или из своих групп.
	 *
	 * @param currentUser аутентифицированный пользователь
	 * @param path путь к папке
	 * @return список DeletedFolderInfo
	 * @throws EntityNotFoundException если папка не найдена или не была удалена
	 * @throws SecurityException если нет прав на чтение папки
	 */
	fun getDeletedFolderVersionsForUser(currentUser: CurrentUser, path: String): List<DeletedFolderInfo> {
		if (folderEntityRepository.findByPath(path) == null)
			throw EntityNotFoundException("Папка '$path' не найдена")
		if ((checkAccessForDirectory(currentUser, path) and AccessType.READ.value) == 0)
			throw SecurityException("Нет прав на чтение папки: $path")
		
		
		val versions = deletedFolderRepository.findByOriginalPath(path)
		if (versions.isEmpty())
			throw EntityNotFoundException("Папка '$path' не была удалена")
		return versions.filter { df ->
			currentUser.isAdmin || df.deletedByUser.id == currentUser.id ||
					(isGroupPath(df.originalPath) && groupService.hasUserAccessToGroup(currentUser.id!!, extractGroupFromPath(df.originalPath)!!))
		}.map { df ->
			DeletedFolderInfo(
				originalPath = df.originalPath,
				deletedAt = df.deletedAt,
				version = df.version,
				deletedByUserEmail = df.deletedByUser.email
			)
		}
	}
	
	private fun isGroupPath(path: String): Boolean = path.startsWith("$groupsDir/")
	
	// ================== СКАЧИВАНИЕ ==================
	
	/**
	 * Скачивает файл с проверкой права READ.
	 *
	 * @param currentUser аутентифицированный пользователь
	 * @param relativePath путь к файлу
	 * @return пара: файл и его MIME-тип
	 * @throws SecurityException если нет прав на чтение
	 * @throws IllegalArgumentException если файл не найден или это директория
	 */
	fun downloadFileByPermissions(currentUser: CurrentUser, relativePath: String): Pair<File, String> {
		val parentPath = Paths.get(relativePath).parent?.toString() ?: ""
		val fileName = Paths.get(relativePath).fileName.toString()
		val permissions = checkAccessForFile(currentUser, parentPath, fileName)
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
	 *
	 * @param currentUser аутентифицированный пользователь
	 * @param query поисковый запрос
	 * @param basePath базовая директория для поиска
	 * @return пара: список файлов и список папок
	 * @throws SecurityException если нет прав на чтение в базовой директории
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
	
	/**
	 * Проверяет существование пути и наличие права READ у пользователя.
	 *
	 * @param currentUser аутентифицированный пользователь
	 * @param relativePath путь для проверки
	 * @return true, если путь существует и доступен для чтения
	 */
	fun pathExistsByPermissions(currentUser: CurrentUser, relativePath: String): Boolean {
		val file = getSafePath(relativePath).toFile()
		if (!file.exists()) return false
		return if (file.isDirectory) {
			(checkAccessForDirectory(currentUser, relativePath) and AccessType.READ.value) != 0
		} else {
			val parentPath = Paths.get(relativePath).parent?.toString() ?: ""
			val fileName = file.name
			(checkAccessForFile(currentUser, parentPath, fileName) and AccessType.READ.value) != 0
		}
	}
	
	// ================== ГРУППОВЫЕ ПАПКИ ==================
	
	/**
	 * Создаёт папку для новой группы.
	 *
	 * @param groupName имя группы
	 */
	fun createGroupFolder(groupName: String) {
		val safeName = sanitizeFileName(groupName)
		val dirPath = safeRootPath.resolve(groupsDir).resolve(safeName)
		Files.createDirectories(dirPath)
		val folderEntity = FolderEntity(path = "$groupsDir/$safeName", isDeleted = false)
		folderEntityRepository.save(folderEntity)
		logger.info("Создана папка группы: $groupName")
	}
	
	/**
	 * Перемещает папку группы в корзину (при удалении группы).
	 *
	 * @param groupName имя группы */
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
	
	/**
	 * Переименовывает папку группы при изменении имени группы.
	 *
	 * @param oldGroupName старое имя группы
	 * @param newGroupName новое имя группы
	 * @return true если перемещение успешно, false если исходная папка не существует
	 */
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
	 *
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
	 *
	 * @param filters фильтры по пользователю, префиксу пути и типу (файл/папка)
	 * @return список WorkHistory
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