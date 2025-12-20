package org.zak.service

import org.zak.dto.file.FileInfo
import org.zak.dto.file.FolderInfo
import org.zak.entity.*
import org.zak.repository.DeletedFileRepository
import org.zak.repository.DirectoryMetadataRepository
import org.zak.repository.FileMetadataRepository
import jakarta.annotation.PostConstruct
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.io.File
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.nio.file.attribute.BasicFileAttributes
import java.time.LocalDateTime
import java.time.ZoneId
import java.util.*
import kotlin.io.path.Path

data class DeletedFileInfo(
	val id: Long,
	val originalPath: String,
	val deletedPath: String,
	val deletedAt: Date,
	val version: Int,
	val deletedByUserId: Int?,
	val deletedByGroupId: Int?
)

data class DeletedPathInfo(
	val originalPath: String,
	val version: Int,
	val timestamp: Long
)

enum class AccessType {
	READ, WRITE, DELETE, CREATE
}

@Service
class FileSystemService(
	private val deletedFileRepository: DeletedFileRepository,
	private val fileMetadataRepository: FileMetadataRepository,
	private val directoryMetadataRepository: DirectoryMetadataRepository
) {
	
	@PersistenceContext
	private lateinit var entityManager: EntityManager
	
	private val logger = LoggerFactory.getLogger(FileSystemService::class.java)
	private val deletedFilesDir = "deleted_files"
	private val groupsDir = "groups"
	private val recoveredDir = "recovered"
	
	@Value("\${file-server.root-directory:./files}")
	private lateinit var rootDirectory: String
	
	@Value("\${file-server.root-directory-deleted:./deleted_files}")
	private lateinit var rootDirectoryDeleted: String
	
	private lateinit var safeRootPath: Path
	private lateinit var safeRootPathDeleted: Path
	
	@PostConstruct
	fun init() {
		safeRootPath = Paths.get(rootDirectory).normalize().toAbsolutePath()
		if (!Files.exists(safeRootPath)) {
			Files.createDirectories(safeRootPath)
			logger.info("Создана корневая директория: $safeRootPath")
		}
		
		// Создаем папку groups, если её нет
		val groupsFolder = safeRootPath.resolve(groupsDir).toFile()
		if (!groupsFolder.exists()) {
			groupsFolder.mkdirs()
			logger.info("Создана папка групп: $groupsFolder")
		}
		
		safeRootPathDeleted = Paths.get(rootDirectoryDeleted).normalize().toAbsolutePath()
		if (!Files.exists(safeRootPathDeleted)) {
			Files.createDirectories(safeRootPathDeleted)
			logger.info("Создана корневая директория удаленных файлов: $safeRootPathDeleted")
		}
		
		logger.info("Файловый сервис инициализирован. Корневая директория: $safeRootPath")
		logger.info("Файловый сервис инициализирован. Корневая директория удаленных файлов: $safeRootPathDeleted")
	}
	
	// ================== НОВЫЕ МЕТОДЫ С ПРАВАМИ ==================
	
	@Transactional(rollbackFor = [Exception::class])
	fun secureDelete(relativePath: String, userId: Int, userGroups: List<Int>, isAdmin: Boolean = false): Boolean {
		// Папку groups нельзя удалять никому, даже админу
		if (relativePath == groupsDir) {
			throw SecurityException("Папка групп неудаляема")
		}
		
		// Проверка прав доступа для не-админов
		if (!isAdmin) {
			checkUserAccess(relativePath, userId, userGroups, AccessType.DELETE, false)
		}
		
		// Используем старый метод delete, но с проверкой на папку groups
		return delete(relativePath, skipGroupsCheck = true)
	}
	
	@Transactional(rollbackFor = [Exception::class])
	fun secureDeleteFile(relativePath: String, userId: Int, userGroups: List<Int>, isAdmin: Boolean = false): Boolean {
		// Проверяем, что это не папка groups
		if (relativePath == groupsDir) {
			throw SecurityException("Папка групп неудаляема")
		}
		
		// Проверка прав доступа для не-админов
		if (!isAdmin) {
			checkUserAccess(relativePath, userId, userGroups, AccessType.DELETE, false)
		}
		
		return deleteFileOrFolder(relativePath, userId, userGroups, isAdmin)
	}
	
	fun secureListDirectory(
		relativePath: String,
		userId: Int,
		userGroups: List<Int>,
		isAdmin: Boolean = false
	): Pair<List<FileInfo>, List<FolderInfo>> {
		// Проверка прав доступа для не-админов
		if (!isAdmin) {
			checkUserAccess(relativePath, userId, userGroups, AccessType.READ, false)
		}
		
		return listDirectory(relativePath)
	}
	
	fun secureUploadFile(
		relativePath: String,
		file: MultipartFile,
		userId: Int,
		userGroups: List<Int>,
		isAdmin: Boolean = false
	): FileInfo {
		// Проверка прав доступа для не-админов
		if (!isAdmin) {
			checkUserAccess(relativePath, userId, userGroups, AccessType.WRITE, false)
		}
		
		return uploadFile(relativePath, file)
	}
	
	fun secureCreateFolder(
		relativePath: String,
		folderName: String,
		userId: Int,
		userGroups: List<Int>,
		isAdmin: Boolean = false
	): FolderInfo {
		// Проверка прав доступа для не-админов
		if (!isAdmin) {
			checkUserAccess(relativePath, userId, userGroups, AccessType.CREATE, false)
		}
		
		// Дополнительная проверка для папки groups
		if (relativePath == "") {
			val sanitizedName = sanitizeFileName(folderName)
			if (sanitizedName == groupsDir) {
				throw IllegalArgumentException("Папка 'groups' уже существует и является системной")
			}
		}
		
		return createFolder(relativePath, folderName)
	}
	
	fun secureDownloadFile(
		relativePath: String,
		userId: Int,
		userGroups: List<Int>,
		isAdmin: Boolean = false
	): Pair<File, String> {
		// Проверка прав доступа для не-админов
		if (!isAdmin) {
			checkUserAccess(relativePath, userId, userGroups, AccessType.READ, false)
		}
		
		return downloadFile(relativePath)
	}
	
	fun secureSearchFilesAndFolders(
		query: String,
		basePath: String = "",
		userId: Int,
		userGroups: List<Int>,
		isAdmin: Boolean = false
	): Pair<List<FileInfo>, List<FolderInfo>> {
		// Проверка прав доступа для не-админов
		if (!isAdmin && basePath.isNotEmpty()) {
			checkUserAccess(basePath, userId, userGroups, AccessType.READ, false)
		}
		
		return searchFilesAndFolders(query, basePath)
	}
	
	// ================== МЕТОДЫ ПРОВЕРКИ ПРАВ ==================
	
	private fun checkUserAccess(
		path: String,
		userId: Int,
		userGroups: List<Int>,
		accessType: AccessType,
		isAdmin: Boolean = false
	) {
		if (isAdmin) {
			return
		}
		
		// Если путь начинается с groups, проверяем принадлежность к группе
		if (isGroupFolderPath(path)) {
			val groupName = getGroupNameFromPath(path)
			if (groupName != null) {
				// Проверяем, состоит ли пользователь в этой группе
				// TODO: Реализовать проверку через GroupService
				if (!userGroups.any { it.toString() == groupName }) {
					throw SecurityException("Вы не состоите в группе '$groupName'")
				}
				return
			}
		}
		
		// Для других путей пока запрещаем доступ
		throw SecurityException("Доступ разрешен только к папкам групп")
	}
	
	private fun isGroupFolderPath(path: String): Boolean {
		return path.startsWith("$groupsDir/") && path.count { it == '/' } >= 2
	}
	
	private fun getGroupNameFromPath(path: String): String? {
		if (!path.startsWith("$groupsDir/")) return null
		val parts = path.removePrefix("$groupsDir/").split("/")
		return parts.firstOrNull()
	}
	
	// ================== МЕТОД ДЛЯ УДАЛЕНИЯ (С ПОДДЕРЖКОЙ ПРОВЕРКИ groups) ==================
	
	fun delete(relativePath: String, skipGroupsCheck: Boolean = false): Boolean {
		// Проверка на удаление папки groups (если не пропущена проверка)
		if (!skipGroupsCheck && relativePath == groupsDir) {
			throw SecurityException("Папка групп неудаляема")
		}
		
		val target = getSafePath(relativePath).toFile()
		
		if (!target.exists()) {
			throw IllegalArgumentException("Файл или папка не найдены: $relativePath")
		}
		
		// Проверяем права на удаление
		val parentDir = target.parentFile
		if (parentDir != null && !parentDir.canWrite()) {
			throw SecurityException("У вас нет прав на удаление в этой директории")
		}
		
		val deleted = if (target.isDirectory) {
			deleteRecursivelySafe(target, skipGroupsCheck)
		} else {
			target.delete()
		}
		
		if (deleted) {
			logger.info("Удалено: ${target.absolutePath}")
		} else {
			logger.warn("Не удалось удалить: ${target.absolutePath}")
		}
		
		return deleted
	}
	
	private fun deleteRecursivelySafe(file: File, skipGroupsCheck: Boolean): Boolean {
		if (file.isDirectory) {
			// Проверяем, не пытаемся ли удалить папку внутри groups
			val relativePath = getRelativePath(file.toPath())
			if (!skipGroupsCheck && relativePath == groupsDir) {
				throw SecurityException("Папка групп неудаляема")
			}
			
			file.listFiles()?.forEach { child ->
				deleteRecursivelySafe(child, skipGroupsCheck)
			}
		}
		return file.delete()
	}
	
	// ================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ==================
	
	private fun getDeletedSafePath(requestedPath: String): Path {
		val pathComponents = requestedPath.split('/')
			.filter { it.isNotBlank() }
			.map { sanitizeFileName(it) }
		
		val sanitizedPath = pathComponents.joinToString("/")
		val resolved = safeRootPathDeleted.resolve(sanitizedPath).normalize()
		
		if (!resolved.startsWith(safeRootPathDeleted)) {
			throw SecurityException("Доступ за пределы корневой директории удаленных файлов запрещен")
		}
		
		return resolved
	}
	
	private fun determineDeletedFileVersion(originalPath: String, userId: Int): Int {
		val deletedFiles = getDeletedFilesList()
		val samePathFiles = deletedFiles.filter { it.originalPath == originalPath }
		
		return if (samePathFiles.isEmpty()) {
			1
		} else {
			samePathFiles.maxOf { it.version } + 1
		}
	}
	
	private fun generateDeletedFilePath(originalPath: String, timestamp: Long, version: Int): String {
		val baseName = Paths.get(originalPath).fileName.toString()
		val nameWithoutExt = baseName.substringBeforeLast(".")
		val ext = if (baseName.contains(".")) ".${baseName.substringAfterLast(".")}" else ""
		val parentDir = Paths.get(originalPath).parent?.toString() ?: ""
		
		return Paths.get(
			deletedFilesDir,
			parentDir,
			"${nameWithoutExt}_v${version}_$timestamp$ext"
		).normalize().toString().replace("\\", "/")
	}
	
	private fun generateVersionedFilePath(originalPath: String, timestamp: Long, version: Int): String {
		val baseName = Paths.get(originalPath).fileName.toString()
		val nameWithoutExt = baseName.substringBeforeLast(".")
		val ext = if (baseName.contains(".")) ".${baseName.substringAfterLast(".")}" else ""
		val parentDir = Paths.get(originalPath).parent?.toString() ?: ""
		
		return Paths.get(
			parentDir,
			"${nameWithoutExt}_restored_v${version}_$timestamp$ext"
		).normalize().toString().replace("\\", "/")
	}
	
	private fun parseDeletedFilePath(deletedPath: String): DeletedPathInfo {
		val relativePath = deletedPath.removePrefix("$deletedFilesDir/")
		
		val lastSlash = relativePath.lastIndexOf("/")
		val fileName = if (lastSlash != -1) {
			relativePath.substring(lastSlash + 1)
		} else {
			relativePath
		}
		
		val pattern = Regex("""(.+)_v(\d+)_(\d+)(\..+)?$""")
		val match = pattern.find(fileName)
		
		return if (match != null) {
			val (baseName, versionStr, timestampStr, extension) = match.destructured
			val originalFileName = baseName + (extension ?: "")
			val originalPath = if (lastSlash != -1) {
				"${relativePath.substring(0, lastSlash)}/$originalFileName"
			} else {
				originalFileName
			}
			
			DeletedPathInfo(
				originalPath = originalPath,
				version = versionStr.toInt(),
				timestamp = timestampStr.toLong()
			)
		} else {
			DeletedPathInfo(
				originalPath = relativePath,
				version = 1,
				timestamp = System.currentTimeMillis()
			)
		}
	}
	
	@Transactional(rollbackFor = [Exception::class])
	fun deleteFileOrFolder(relativePath: String, userId: Int, userGroups: List<Int>, isAdmin: Boolean = false): Boolean {
		val target = getSafePath(relativePath).toFile()
		
		// Проверка для папки групп (неудаляема)
		if (relativePath == groupsDir) {
			throw SecurityException("Папка групп неудаляема")
		}
		
		return try {
			if (target.isFile) {
				deleteSingleFile(relativePath, userId, isAdmin)
			} else if (target.isDirectory) {
				deleteFolderRecursivelyWithMetadata(relativePath, userId, isAdmin)
			} else {
				false
			}
		} catch (e: Exception) {
			logger.error("Ошибка при удалении $relativePath: ${e.message}", e)
			throw e // Откат транзакции
		}
	}
	
	@Transactional(rollbackFor = [Exception::class])
	private fun deleteSingleFile(fileRelativePath: String, currentUserId: Int, isAdmin: Boolean = false): Boolean {
		val sourceFile = getSafePath(fileRelativePath).toFile()
		
		if (!sourceFile.exists()) {
			throw IllegalArgumentException("Файл не найден: $fileRelativePath")
		}
		
		val metadata = fileMetadataRepository.findByPath(fileRelativePath)
		
		val version = determineDeletedFileVersion(fileRelativePath, currentUserId)
		
		val userProxy = entityManager.getReference(User::class.java, currentUserId)
		val groupProxy = metadata?.group?.let { entityManager.getReference(Group::class.java, it.id) }
		
		val deletedMetadata = FileMetadata(
			path = generateDeletedFilePath(fileRelativePath, System.currentTimeMillis(), version),
			user = userProxy,
			group = groupProxy,
			mode = metadata?.mode ?: 0
		)
		
		val savedMetadata = fileMetadataRepository.save(deletedMetadata)
		
		val deletedFileRecord = DeletedFile().apply {
			fileMetadata = savedMetadata
			workTime = LocalDateTime.now()
		}
		deletedFileRepository.save(deletedFileRecord)
		
		val deletedFilePath = getDeletedSafePath(deletedMetadata.path).toFile()
		deletedFilePath.parentFile.mkdirs()
		
		val moved = sourceFile.renameTo(deletedFilePath)
		if (!moved) {
			throw IllegalStateException("Не удалось переместить файл в папку удаленных")
		}
		
		metadata?.let {
			fileMetadataRepository.delete(it)
		}
		
		logger.info("Файл перемещен в удаленные: $fileRelativePath -> ${deletedMetadata.path}")
		return true
	}
	
	@Transactional(rollbackFor = [Exception::class])
	private fun deleteFolderRecursivelyWithMetadata(folderRelativePath: String, currentUserId: Int, isAdmin: Boolean = false): Boolean {
		val folder = getSafePath(folderRelativePath).toFile()
		
		if (!folder.exists() || !folder.isDirectory) {
			throw IllegalArgumentException("Папка не найдена: $folderRelativePath")
		}
		
		fun processDirectory(dir: File) {
			dir.listFiles()?.forEach { file ->
				if (file.isFile) {
					val fileRelativePath = getRelativePath(file.toPath())
					deleteSingleFile(fileRelativePath, currentUserId, isAdmin)
				} else if (file.isDirectory) {
					val childRelativePath = getRelativePath(file.toPath())
					if (folderRelativePath == groupsDir) {
						logger.info("Пропущена папка группы: $childRelativePath")
					} else {
						processDirectory(file)
					}
				}
			}
		}
		
		processDirectory(folder)
		
		if (folder.list()?.isEmpty() != false) {
			val directories = directoryMetadataRepository.findByPathStartingWith(folderRelativePath)
			directoryMetadataRepository.deleteAll(directories)
			
			if (folder.delete()) {
				logger.info("Пустая папка удалена: $folderRelativePath")
			}
		}
		
		return true
	}
	
	@Transactional(rollbackFor = [Exception::class])
	fun restoreFile(deletedFileId: Long, restoreUserId: Int, userGroups: List<Int>, isAdmin: Boolean = false): Boolean {
		val deletedFileRecord = deletedFileRepository.findById(deletedFileId).orElseThrow {
			IllegalArgumentException("Запись об удаленном файле не найдена")
		}
		
		val deletedMetadata = deletedFileRecord.fileMetadata ?: throw IllegalArgumentException("Метаданные удаленного файла не найдены")
		
		val deletedPathInfo = parseDeletedFilePath(deletedMetadata.path)
		var originalPath = deletedPathInfo.originalPath
		
		val originalPathObj = Paths.get(originalPath)
		val parentPath = originalPathObj.parent
		val shouldUseRecovered = if (parentPath != null) {
			val parentDir = getSafePath(parentPath.toString()).toFile()
			!parentDir.exists()
		} else {
			true
		}
		
		if (shouldUseRecovered) {
			originalPath = "$recoveredDir/$originalPath"
		}
		
		if (!isAdmin) {
			val targetPath = if (shouldUseRecovered) originalPath else parentPath?.toString() ?: ""
			if (targetPath.isNotEmpty()) {
				checkUserAccess(targetPath, restoreUserId, userGroups, AccessType.WRITE, false)
			}
		}
		
		val existingFile = getSafePath(originalPath).toFile()
		val (finalPath, version) = if (existingFile.exists()) {
			val version = determineRestoredFileVersion(originalPath)
			val newPath = generateVersionedFilePath(originalPath, System.currentTimeMillis(), version)
			Pair(newPath, version)
		} else {
			Pair(originalPath, 1)
		}
		
		val sourceFile = getDeletedSafePath(deletedMetadata.path).toFile()
		if (!sourceFile.exists()) {
			throw IllegalArgumentException("Физический файл не найден: ${deletedMetadata.path}")
		}
		
		val targetFile = getSafePath(finalPath).toFile()
		targetFile.parentFile.mkdirs()
		
		val moved = sourceFile.renameTo(targetFile)
		if (!moved) {
			throw IllegalStateException("Не удалось восстановить файл")
		}
		
		val restoredMetadata = FileMetadata(
			path = finalPath,
			user = entityManager.getReference(User::class.java, restoreUserId),
			group = deletedMetadata.group,
			mode = deletedMetadata.mode
		)
		fileMetadataRepository.save(restoredMetadata)
		
		deletedFileRepository.delete(deletedFileRecord)
		fileMetadataRepository.delete(deletedMetadata)
		
		logger.info("Файл восстановлен: $finalPath (версия: $version)")
		return true
	}
	
	private fun determineRestoredFileVersion(originalPath: String): Int {
		val baseName = Paths.get(originalPath).fileName.toString()
		val nameWithoutExt = baseName.substringBeforeLast(".")
		val dir = Paths.get(originalPath).parent?.toString() ?: ""
		
		val existingFiles = fileMetadataRepository.findByPathStartingWith(dir)
			.filter { it.path.contains("_restored_v") && it.path.contains(nameWithoutExt) }
		
		val versions = existingFiles.mapNotNull { metadata ->
			val pattern = Regex(".*_restored_v(\\d+)_\\d+.*")
			pattern.find(metadata.path)?.groupValues?.get(1)?.toIntOrNull()
		}
		
		return if (versions.isEmpty()) 1 else versions.max() + 1
	}
	
	fun getDeletedFilesList(): List<DeletedFileInfo> {
		val deletedFiles = deletedFileRepository.findAllOrderByWorkTimeDesc()
		
		return deletedFiles.mapNotNull { deletedRecord ->
			val metadata = deletedRecord.fileMetadata
			if (metadata == null || !metadata.path.startsWith(deletedFilesDir)) {
				return@mapNotNull null
			}
			
			val deletedPathInfo = parseDeletedFilePath(metadata.path)
			
			DeletedFileInfo(
				id = metadata.id ?: 0,
				originalPath = deletedPathInfo.originalPath,
				deletedPath = metadata.path,
				deletedAt = Date(deletedRecord.workTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()),
				version = deletedPathInfo.version,
				deletedByUserId = metadata.user?.id,
				deletedByGroupId = metadata.group?.id
			)
		}
	}
	
	// ================== СТАРЫЕ МЕТОДЫ (БЕЗ ИЗМЕНЕНИЙ) ==================
	
	private fun getSafePath(requestedPath: String): Path {
		val pathComponents = requestedPath.split('/')
			.filter { it.isNotBlank() }
			.map { sanitizeFileName(it) }
		
		val sanitizedPath = pathComponents.joinToString("/")
		val resolved = safeRootPath.resolve(sanitizedPath).normalize()
		
		if (!resolved.startsWith(safeRootPath)) {
			throw SecurityException("Доступ за пределы корневой директории запрещен")
		}
		
		return resolved
	}
	
	private fun getRelativePath(absolutePath: Path): String {
		return safeRootPath.relativize(absolutePath.normalize()).toString().replace("\\", "/")
	}
	
	fun listDirectory(relativePath: String): Pair<List<FileInfo>, List<FolderInfo>> {
		val directory = getSafePath(relativePath).toFile()
		
		if (!directory.exists()) {
			throw IllegalArgumentException("Директория не найдена: ${directory.absolutePath}")
		}
		
		if (!directory.isDirectory) {
			throw IllegalArgumentException("Указанный путь не является директорией: ${directory.absolutePath}")
		}
		
		if (!directory.canRead()) {
			throw SecurityException("У вас нет прав доступа к директории: ${directory.absolutePath}")
		}
		
		val filesList = mutableListOf<FileInfo>()
		val foldersList = mutableListOf<FolderInfo>()
		
		try {
			directory.listFiles()?.forEach { file ->
				try {
					if (file.isFile) {
						filesList.add(createFileInfo(file))
					} else if (file.isDirectory) {
						foldersList.add(createFolderInfo(file))
					}
				} catch (e: SecurityException) {
					logger.warn("Нет доступа к файлу/папке: ${file.name}")
				} catch (e: Exception) {
					logger.error("Ошибка при обработке ${file.name}: ${e.message}")
				}
			}
		} catch (e: SecurityException) {
			throw SecurityException("У вас нет прав на чтение содержимого директории: ${directory.absolutePath}")
		}
		
		foldersList.sortBy { it.name.lowercase() }
		filesList.sortBy { it.name.lowercase() }
		
		return Pair(filesList, foldersList)
	}
	
	private fun createFileInfo(file: File): FileInfo {
		val path = file.toPath()
		val attributes = Files.readAttributes(path, BasicFileAttributes::class.java)
		val size = file.length()
		val relativePath = getRelativePath(file.toPath())
		
		return FileInfo(
			name = file.name,
			fullPath = relativePath,
			lastModified = Date(attributes.lastModifiedTime().toMillis()),
			size = size,
			extension = getFileExtension(file),
			readableSize = formatSize(size)
		)
	}
	
	private fun createFolderInfo(folder: File): FolderInfo {
		val path = folder.toPath()
		val attributes = Files.readAttributes(path, BasicFileAttributes::class.java)
		val (size, itemCount) = calculateFolderSizeAndCount(folder)
		val relativePath = getRelativePath(folder.toPath())
		
		return FolderInfo(
			name = folder.name,
			fullPath = relativePath,
			lastModified = Date(attributes.lastModifiedTime().toMillis()),
			size = size,
			readableSize = formatSize(size),
			itemCount = itemCount
		)
	}
	
	fun uploadFile(relativePath: String, file: MultipartFile): FileInfo {
		val targetDir = getSafePath(relativePath).toFile()
		
		if (!targetDir.exists()) {
			throw IllegalArgumentException("Целевая директория не найдена: $relativePath")
		}
		
		if (!targetDir.isDirectory) {
			throw IllegalArgumentException("Целевой путь не является директорией: $relativePath")
		}
		
		if (!targetDir.canWrite()) {
			throw SecurityException("У вас нет прав на запись в директорию: $relativePath")
		}
		
		val fileName = sanitizeFileName(file.originalFilename ?: "unnamed")
		val targetFile = File(targetDir, fileName)
		
		if (targetFile.exists()) {
			throw IllegalArgumentException("Файл с именем '$fileName' уже существует")
		}
		
		file.transferTo(targetFile)
		
		logger.info("Файл загружен: ${targetFile.absolutePath}")
		
		return createFileInfo(targetFile)
	}
	
	fun createFolder(relativePath: String, folderName: String): FolderInfo {
		val parentDir = getSafePath(relativePath).toFile()
		
		if (!parentDir.exists()) {
			throw IllegalArgumentException("Родительская директория не найдена: $relativePath")
		}
		
		if (!parentDir.isDirectory) {
			throw IllegalArgumentException("Родительский путь не является директорией: $relativePath")
		}
		
		if (!parentDir.canWrite()) {
			throw SecurityException("У вас нет прав на создание папки в директории: $relativePath")
		}
		
		val sanitizedName = sanitizeFileName(folderName)
		val newFolder = File(parentDir, sanitizedName)
		
		if (newFolder.exists()) {
			throw IllegalArgumentException("Папка с именем '$sanitizedName' уже существует")
		}
		
		val created = newFolder.mkdirs()
		if (!created) {
			throw IllegalStateException("Не удалось создать папку: $sanitizedName")
		}
		
		logger.info("Папка создана: ${newFolder.absolutePath}")
		
		return createFolderInfo(newFolder)
	}
	
	fun downloadFile(relativePath: String): Pair<File, String> {
		val file = getSafePath(relativePath).toFile()
		
		if (!file.exists()) {
			throw IllegalArgumentException("Файл не найден: $relativePath")
		}
		
		if (file.isDirectory) {
			throw IllegalArgumentException("Невозможно скачать директорию: $relativePath")
		}
		
		if (!file.canRead()) {
			throw SecurityException("У вас нет прав на чтение файла: $relativePath")
		}
		
		return Pair(file, "text/plain")
	}
	
	fun searchFilesAndFolders(query: String, basePath: String = ""): Pair<List<FileInfo>, List<FolderInfo>> {
		val directory = getSafePath(basePath).toFile()
		
		if (!directory.exists()) {
			throw IllegalArgumentException("Директория не найдена: ${directory.absolutePath}")
		}
		
		if (!directory.isDirectory) {
			throw IllegalArgumentException("Путь не является директорией: ${directory.absolutePath}")
		}
		
		val filesList = mutableListOf<FileInfo>()
		val foldersList = mutableListOf<FolderInfo>()
		
		fun searchRecursively(currentDir: File) {
			currentDir.listFiles()?.forEach { file ->
				try {
					val matchesQuery = file.name.contains(query, ignoreCase = true)
					
					if (matchesQuery) {
						if (file.isFile) {
							filesList.add(createFileInfo(file))
						} else if (file.isDirectory) {
							foldersList.add(createFolderInfo(file))
						}
					}
					
					if (file.isDirectory) {
						searchRecursively(file)
					}
				} catch (e: SecurityException) {
					logger.warn("Нет доступа к файлу/папке: ${file.name}")
				} catch (e: Exception) {
					logger.error("Ошибка при обработке ${file.name}: ${e.message}")
				}
			}
		}
		
		searchRecursively(directory)
		
		foldersList.sortBy { it.name.lowercase() }
		filesList.sortBy { it.name.lowercase() }
		
		return Pair(filesList, foldersList)
	}
	
	fun pathExists(relativePath: String): Boolean {
		return try {
			getSafePath(relativePath).toFile().exists()
		} catch (e: SecurityException) {
			false
		} catch (e: Exception) {
			false
		}
	}
	
	// ================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ (БЕЗ ИЗМЕНЕНИЙ) ==================
	
	private fun calculateFolderSizeAndCount(folder: File): Pair<Long, Int> {
		var totalSize = 0L
		var totalCount = 0
		
		folder.listFiles()?.forEach { file ->
			try {
				if (file.isFile) {
					totalSize += file.length()
					totalCount++
				} else if (file.isDirectory) {
					val (subSize, subCount) = calculateFolderSizeAndCount(file)
					totalSize += subSize
					totalCount += subCount + 1
				}
			} catch (e: SecurityException) {
				// Игнорируем файлы без доступа
			}
		}
		
		return Pair(totalSize, totalCount)
	}
	
	private fun getFileExtension(file: File): String {
		val fileName = file.name
		val dotIndex = fileName.lastIndexOf('.')
		return if (dotIndex > 0 && dotIndex < fileName.length - 1) {
			fileName.substring(dotIndex + 1).lowercase()
		} else {
			""
		}
	}
	
	private fun formatSize(size: Long): String {
		if (size <= 0) return "0 B"
		
		val units = arrayOf("B", "KB", "MB", "GB", "TB")
		var currentSize = size.toDouble()
		var unitIndex = 0
		
		while (currentSize >= 1024 && unitIndex < units.size - 1) {
			currentSize /= 1024
			unitIndex++
		}
		
		return "%.2f %s".format(Locale.US, currentSize, units[unitIndex])
	}
	
	private fun deleteRecursively(file: File): Boolean {
		if (file.isDirectory) {
			file.listFiles()?.forEach { child ->
				deleteRecursively(child)
			}
		}
		return file.delete()
	}
	
	private fun getContentType(file: File): String {
		val fileName = file.name.lowercase()
		
		return when {
			fileName.endsWith(".pdf") -> "application/pdf"
			fileName.endsWith(".txt") -> "text/plain"
			fileName.endsWith(".html") || fileName.endsWith(".htm") -> "text/html"
			fileName.endsWith(".css") -> "text/css"
			fileName.endsWith(".js") -> "application/javascript"
			fileName.endsWith(".json") -> "application/json"
			fileName.endsWith(".xml") -> "application/xml"
			
			fileName.endsWith(".jpg") || fileName.endsWith(".jpeg") -> "image/jpeg"
			fileName.endsWith(".png") -> "image/png"
			fileName.endsWith(".gif") -> "image/gif"
			fileName.endsWith(".bmp") -> "image/bmp"
			fileName.endsWith(".svg") -> "image/svg+xml"
			
			fileName.endsWith(".zip") -> "application/zip"
			fileName.endsWith(".rar") -> "application/x-rar-compressed"
			fileName.endsWith(".7z") -> "application/x-7z-compressed"
			fileName.endsWith(".tar") -> "application/x-tar"
			fileName.endsWith(".gz") -> "application/gzip"
			
			fileName.endsWith(".doc") -> "application/msword"
			fileName.endsWith(".docx") -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
			fileName.endsWith(".xls") -> "application/vnd.ms-excel"
			fileName.endsWith(".xlsx") -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
			fileName.endsWith(".ppt") -> "application/vnd.ms-powerpoint"
			fileName.endsWith(".pptx") -> "application/vnd.openxmlformats-officedocument.presentationml.presentation"
			fileName.endsWith(".mp4") -> "video/mp4"
			fileName.endsWith(".avi") -> "video/x-msvideo"
			fileName.endsWith(".mov") -> "video/quicktime"
			fileName.endsWith(".mkv") -> "video/x-matroska"
			
			fileName.endsWith(".mp3") -> "audio/mpeg"
			fileName.endsWith(".wav") -> "audio/wav"
			fileName.endsWith(".ogg") -> "audio/ogg"
			
			else -> "application/octet-stream"
		}
	}
	
	private fun sanitizeFileName(fileName: String): String {
		return fileName.replace(Regex("[<>:\"\\\\|?*]"), "_")
	}
	
	fun checkAccessToCreate(idUser: Int, path: String) {
		// TODO: Реализовать проверку прав на создание
	}
}