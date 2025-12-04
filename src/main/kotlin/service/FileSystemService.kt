package org.zak.service

import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import org.zak.dto.file.FileInfo
import org.zak.dto.file.FolderInfo
import java.io.File
import java.io.FileInputStream
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.nio.file.StandardCopyOption
import java.nio.file.attribute.BasicFileAttributes
import java.text.SimpleDateFormat
import java.util.*


@Service
class FileSystemService {
	
	private val logger = LoggerFactory.getLogger(FileSystemService::class.java)
	private val dateFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
	
	@Value("\${file-server.root-directory:./files}")
	private lateinit var rootDirectory: String
	
	private lateinit var safeRootPath: Path
	
	@PostConstruct
	fun init() {
		safeRootPath = Paths.get(rootDirectory).normalize().toAbsolutePath()
		
		if (!Files.exists(safeRootPath)) {
			Files.createDirectories(safeRootPath)
			logger.info("Создана корневая директория: $safeRootPath")
		}
		
		logger.info("Файловый сервис инициализирован. Корневая директория: $safeRootPath")
	}
	
	private fun getSafePath(requestedPath: String): Path {
		val normalized = Paths.get(requestedPath).normalize()
		val safe = sanitizeFileName(normalized.toString())
		val resolved = safeRootPath.resolve(safe).normalize()
		
		if (!resolved.startsWith(safeRootPath)) {
			throw SecurityException("Доступ за пределы корневой директории запрещен")
		}
		
		return resolved
	}
	
	/**
	 * Получить содержимое директории
	 */
	fun listDirectory(path: String): Pair<List<FileInfo>, List<FolderInfo>> {
		val directory = getSafePath(path).toFile()
		
		// Проверяем существование директории
		if (!directory.exists()) {
			throw IllegalArgumentException("Директория не найдена: ${directory.absolutePath}")
		}
		
		// Проверяем, что это директория
		if (!directory.isDirectory) {
			throw IllegalArgumentException("Указанный путь не является директорией: ${directory.absolutePath}")
		}
		
		// Проверяем права доступа
		if (!directory.canRead()) {
			throw SecurityException("У вас нет прав доступа к директории: ${directory.absolutePath}")
		}
		
		val filesList = mutableListOf<FileInfo>()
		val foldersList = mutableListOf<FolderInfo>()
		
		try {
			directory.listFiles()?.forEach { file ->
				try {
					if (file.isFile) {
						filesList.add(createFileInfo(file, path))
					} else if (file.isDirectory) {
						foldersList.add(createFolderInfo(file, path))
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
	
	private fun createFileInfo(file: File, basePath: String): FileInfo {
		val path = file.toPath()
		val attributes = Files.readAttributes(path, BasicFileAttributes::class.java)
		val size = file.length()
		
		return FileInfo(
			name = file.name,
			path = Paths.get(basePath, file.name).toString().replace("\\", "/"),
			lastModified = Date(attributes.lastModifiedTime().toMillis()),
			size = size,
			extension = getFileExtension(file),
			readableSize = formatSize(size)
		)
	}
	
	private fun createFolderInfo(folder: File, basePath: String): FolderInfo {
		val path = folder.toPath()
		val attributes = Files.readAttributes(path, BasicFileAttributes::class.java)
		val (size, itemCount) = calculateFolderSizeAndCount(folder)
		
		return FolderInfo(
			name = folder.name,
			path = Paths.get(basePath, folder.name).toString().replace("\\", "/"),
			lastModified = Date(attributes.lastModifiedTime().toMillis()),
			size = size,
			readableSize = formatSize(size),
			itemCount = itemCount
		)
	}
	
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
	
	fun uploadFile(path: String, file: MultipartFile): FileInfo {
		val targetDir = getSafePath(path).toFile()
		
		if (!targetDir.exists()) {
			throw IllegalArgumentException("Целевая директория не найдена: $path")
		}
		
		if (!targetDir.isDirectory) {
			throw IllegalArgumentException("Целевой путь не является директорией: $path")
		}
		
		if (!targetDir.canWrite()) {
			throw SecurityException("У вас нет прав на запись в директорию: $path")
		}
		
		val fileName = sanitizeFileName(file.originalFilename ?: "unnamed")
		val targetFile = File(targetDir, fileName)
		
		if (targetFile.exists()) {
			throw IllegalArgumentException("Файл с именем '$fileName' уже существует")
		}
		
		file.transferTo(targetFile)
		
		logger.info("Файл загружен: ${targetFile.absolutePath}")
		
		return createFileInfo(targetFile, path)
	}
	
	fun createFolder(path: String, folderName: String): FolderInfo {
		val parentDir = getSafePath(path).toFile()
		
		if (!parentDir.exists()) {
			throw IllegalArgumentException("Родительская директория не найдена: $path")
		}
		
		if (!parentDir.isDirectory) {
			throw IllegalArgumentException("Родительский путь не является директорией: $path")
		}
		
		if (!parentDir.canWrite()) {
			throw SecurityException("У вас нет прав на создание папки в директории: $path")
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
		
		return createFolderInfo(newFolder, path)
	}
	
	fun delete(path: String): Boolean {
		val target = getSafePath(path).toFile()
		
		if (!target.exists()) {
			throw IllegalArgumentException("Файл или папка не найдены: $path")
		}
		
		// Проверяем права на удаление
		val parentDir = target.parentFile
		if (parentDir != null && !parentDir.canWrite()) {
			throw SecurityException("У вас нет прав на удаление в этой директории")
		}
		
		val deleted = if (target.isDirectory) {
			deleteRecursively(target)
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
	
	private fun deleteRecursively(file: File): Boolean {
		if (file.isDirectory) {
			file.listFiles()?.forEach { child ->
				deleteRecursively(child)
			}
		}
		return file.delete()
	}
	
	fun downloadFile(path: String): Pair<File, String> {
		val file = getSafePath(path).toFile()
		
		if (!file.exists()) {
			throw IllegalArgumentException("Файл не найден: $path")
		}
		
		if (file.isDirectory) {
			throw IllegalArgumentException("Невозможно скачать директорию: $path")
		}
		
		if (!file.canRead()) {
			throw SecurityException("У вас нет прав на чтение файла: $path")
		}
		
		return Pair(file, getContentType(file))
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
		
		// Рекурсивный поиск
		fun searchRecursively(currentDir: File) {
			currentDir.listFiles()?.forEach { file ->
				try {
					// Проверяем, соответствует ли имя файла/папки запросу
					val matchesQuery = file.name.contains(query, ignoreCase = true)
					
					if (matchesQuery) {
						if (file.isFile) {
							filesList.add(createFileInfo(file, basePath))
						} else if (file.isDirectory) {
							foldersList.add(createFolderInfo(file, basePath))
						}
					}
					
					// Рекурсивно ищем в подпапках
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
		
		// Сортировка результатов
		foldersList.sortBy { it.name.lowercase() }
		filesList.sortBy { it.name.lowercase() }
		
		return Pair(filesList, foldersList)
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
		return fileName.replace(Regex("[<>:\"/\\\\|?*]"), "_").replace("..","")
	}
	
	private fun safeExists(path: String): Boolean {
		try {
			val sanitizedPath = sanitizeDirectoryPath(path)
			val resolved = safeRootPath.resolve(path)
			return File(resolved.toString()).exists()
		} catch (e: SecurityException) {
			return false  // Нет прав доступа
		} catch (e: Exception) {
			return false  // Другие ошибки
		}
	}
	private fun sanitizeDirectoryPath(path: String, allowAbsolute: Boolean = false): String {
		return path.replace(Regex("[<>:\"\\\\|?*]"), "_")
			.replace(Regex("/{2,}"), "/")
			.replace(Regex("${if (!allowAbsolute) "^/" else ""}/$"), "") // Условно убираем начальный слеш
			.replace(Regex("(\\.\\./|\\./)"), "")
			.ifEmpty { "" }
	}
	
	public fun pathExistsPub(path: String): Boolean{
		return safeExists(path)
	}
	private fun pathExists(path: String): Boolean {
		return try {
			getSafePath(path).toFile().exists()
		} catch (e: SecurityException) {
			false
		}
	}
	
	fun getFileInfo(path: String): Any {
		val file = getSafePath(path).toFile()
		
		if (!file.exists()) {
			throw IllegalArgumentException("Файл или папка не найдены: $path")
		}
		
		return if (file.isFile) {
			createFileInfo(file, file.parentFile?.name ?: "")
		} else {
			createFolderInfo(file, file.parentFile?.name ?: "")
		}
	}
}