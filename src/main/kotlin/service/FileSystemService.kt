package org.zak.service

import jakarta.annotation.PostConstruct
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import org.zak.dto.file.FileInfo
import org.zak.dto.file.FolderInfo
import java.io.File
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.nio.file.attribute.BasicFileAttributes
import java.util.*


@Service
class FileSystemService {
	
	private val logger = LoggerFactory.getLogger(FileSystemService::class.java)
	
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
		// Разделяем путь на компоненты и санитайзим каждый компонент отдельно
		val pathComponents = requestedPath.split('/')
			.filter { it.isNotBlank() }
			.map { sanitizeFileName(it) }
		
		// Собираем путь обратно
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
	
	/**
	 * Получить содержимое директории
	 */
	fun listDirectory(relativePath: String): Pair<List<FileInfo>, List<FolderInfo>> {
		val directory = getSafePath(relativePath).toFile()
		
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
	
	fun delete(relativePath: String): Boolean {
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
		
		// Рекурсивный поиск
		fun searchRecursively(currentDir: File) {
			currentDir.listFiles()?.forEach { file ->
				try {
					// Проверяем, соответствует ли имя файла/папки запросу
					val matchesQuery = file.name.contains(query, ignoreCase = true)
					
					if (matchesQuery) {
						if (file.isFile) {
							filesList.add(createFileInfo(file))
						} else if (file.isDirectory) {
							foldersList.add(createFolderInfo(file))
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
	
	fun pathExists(relativePath: String): Boolean {
		return try {
			getSafePath(relativePath).toFile().exists()
		} catch (e: SecurityException) {
			false
		} catch (e: Exception) {
			false
		}
	}
	
	// Остальные методы без изменений...
	
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
		// Заменяем только недопустимые символы в имени файла, но не слеши
		return fileName.replace(Regex("[<>:\"\\\\|?*]"), "_")
	}
}