package org.zak.controller


import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.core.io.FileSystemResource
import org.springframework.core.io.InputStreamResource
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import org.zak.dto.file.CreateFolderRequest
import org.zak.dto.file.FileSystemResponse
import org.zak.dto.file.FileUploadResponse
import org.zak.dto.file.DeleteRequest
import org.zak.service.FileSystemService
import java.io.FileInputStream
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths

@RestController
@RequestMapping("/api/files")
class FileController(
	private val fileSystemService: FileSystemService
) {
	
	private val logger = LoggerFactory.getLogger(FileController::class.java)
	
	/**
	 * Получить содержимое директории
	 */
	@GetMapping("/list")
	fun listDirectory(
		@RequestParam(defaultValue = "") path: String
	): ResponseEntity<FileSystemResponse> {
		return try {
			val (files, folders) = fileSystemService.listDirectory(path)
			val totalSize = files.sumOf { it.size } + folders.sumOf { it.size }
			val readableTotalSize = formatSize(totalSize)
			
			val parentPath = if (path.isNotEmpty()) {
				Paths.get(path).parent?.toString() ?: ""
			} else {
				null
			}
			
			val response = FileSystemResponse(
				path = path,
				parentPath = parentPath,
				files = files,
				folders = folders,
				totalFiles = files.size,
				totalFolders = folders.size,
				totalSize = readableTotalSize
			)
			
			ResponseEntity.ok(response)
		} catch (e: Exception) {
			logger.error("Ошибка при получении списка файлов для пути: $path", e)
			ResponseEntity.status(HttpStatus.BAD_REQUEST).build()
		}
	}
	
	/**
	 * Загрузить файл
	 */
	@PostMapping("/upload")
	fun uploadFile(
		@RequestParam("file") file: MultipartFile,
		@RequestParam(defaultValue = "") path: String
	): ResponseEntity<FileUploadResponse> {
		return try {
			if (file.isEmpty) {
				return ResponseEntity.badRequest().body(
					FileUploadResponse(
						success = false,
						message = "Файл пустой"
					)
				)
			}
			
			val fileInfo = fileSystemService.uploadFile(path, file)
			
			ResponseEntity.ok(
				FileUploadResponse(
					success = true,
					message = "Файл успешно загружен",
					file = fileInfo
				)
			)
		} catch (e: Exception) {
			logger.error("Ошибка при загрузке файла в путь: $path", e)
			ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
				FileUploadResponse(
					success = false,
					message = e.message ?: "Ошибка при загрузке файла"
				)
			)
		}
	}
	
	/**
	 * Создать папку
	 */
	@PostMapping("/create-folder")
	fun createFolder(@RequestBody request: CreateFolderRequest): ResponseEntity<Any> {
		return try {
			if (request.folderName.isBlank()) {
				return ResponseEntity.badRequest().body(
					mapOf("error" to "Имя папки не может быть пустым")
				)
			}
			
			val folderInfo = fileSystemService.createFolder(request.path, request.folderName)
			
			ResponseEntity.ok(
				mapOf(
					"success" to true,
					"message" to "Папка успешно создана",
					"folder" to folderInfo
				)
			)
		} catch (e: Exception) {
			logger.error("Ошибка при создании папки: ${request.folderName} в пути: ${request.path}", e)
			ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
				mapOf(
					"error" to (e.message ?: "Ошибка при создании папки"),
					"success" to false
				)
			)
		}
	}
	
	/**
	 * Удалить файл или папку
	 */
	@DeleteMapping("/delete")
	fun delete(@RequestBody request: DeleteRequest): ResponseEntity<Any> {
		return try {
			val deleted = fileSystemService.delete(request.path)
			
			if (deleted) {
				ResponseEntity.ok(
					mapOf(
						"success" to true,
						"message" to "Файл или папка успешно удалены"
					)
				)
			} else {
				ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
					mapOf(
						"error" to "Не удалось удалить файл или папку",
						"success" to false
					)
				)
			}
		} catch (e: Exception) {
			logger.error("Ошибка при удалении: ${request.path}", e)
			ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
				mapOf(
					"error" to (e.message ?: "Ошибка при удалении"),
					"success" to false
				)
			)
		}
	}
	
	/**
	 * Скачать файл
	 */
	@GetMapping("/download")
	fun downloadFile(
		@RequestParam path: String,
		response: HttpServletResponse
	) {
		try {
			val (file, contentType) = fileSystemService.downloadFile(path)
			
			response.contentType = contentType
			response.setHeader(
				HttpHeaders.CONTENT_DISPOSITION,
				"attachment; filename=\"${file.name}\""
			)
			response.setHeader(HttpHeaders.CONTENT_LENGTH, file.length().toString())
			
			Files.copy(file.toPath(), response.outputStream)
			response.outputStream.flush()
		} catch (e: Exception) {
			logger.error("Ошибка при скачивании файла: $path", e)
			response.status = HttpServletResponse.SC_NOT_FOUND
			response.writer.write("Файл не найден")
		}
	}
	
	/**
	 * Просмотр файла (для текстовых файлов, изображений и т.д.)
	 */
	@GetMapping("/view")
	fun viewFile(@RequestParam path: String): ResponseEntity<InputStreamResource> {
		return try {
			val (file, contentType) = fileSystemService.downloadFile(path)
			
			val resource = FileSystemResource(file)
			
			val headers = HttpHeaders().apply {
				add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"${file.name}\"")
				add(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
				add(HttpHeaders.PRAGMA, "no-cache")
				add(HttpHeaders.EXPIRES, "0")
			}
			
			ResponseEntity.ok()
				.headers(headers)
				.contentLength(file.length())
				.contentType(MediaType.parseMediaType(contentType))
				.body(InputStreamResource(FileInputStream(file)))
		} catch (e: Exception) {
			logger.error("Ошибка при просмотре файла: $path", e)
			ResponseEntity.notFound().build()
		}
	}
	
	/**
	 * Получить информацию о файле/папке
	 */
	@GetMapping("/info")
	fun getFileInfo(@RequestParam path: String): ResponseEntity<Any> {
		return try {
			val info = fileSystemService.getFileInfo(path)
			ResponseEntity.ok(
				mapOf(
					"success" to true,
					"data" to info
				)
			)
		} catch (e: Exception) {
			logger.error("Ошибка при получении информации: $path", e)
			ResponseEntity.status(HttpStatus.NOT_FOUND).body(
				mapOf(
					"error" to (e.message ?: "Файл или папка не найдены"),
					"success" to false
				)
			)
		}
	}
	
	/**
	 * Проверить существование пути
	 */
	@GetMapping("/exists")
	fun pathExists(@RequestParam path: String): ResponseEntity<Any> {
		return try {
			val exists = fileSystemService.pathExists(path)
			ResponseEntity.ok(
				mapOf(
					"exists" to exists,
					"path" to path
				)
			)
		} catch (e: Exception) {
			ResponseEntity.ok(
				mapOf(
					"exists" to false,
					"path" to path,
					"error" to e.message
				)
			)
		}
	}
	
	/**
	 * Получить корневую директорию
	 */
	@GetMapping("/root")
	fun getRootDirectory(): ResponseEntity<Any> {
		return try {
			ResponseEntity.ok(
				mapOf(
					"rootDirectory" to fileSystemService.listDirectory("")
				)
			)
		} catch (e: Exception) {
			logger.error("Ошибка при получении корневой директории", e)
			ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
				mapOf("error" to "Ошибка при получении корневой директории")
			)
		}
	}
	
	/**
	 * Форматирование размера (дублируем логику сервиса для контроллера)
	 */
	private fun formatSize(size: Long): String {
		if (size <= 0) return "0 B"
		
		val units = arrayOf("B", "KB", "MB", "GB", "TB")
		var currentSize = size.toDouble()
		var unitIndex = 0
		
		while (currentSize >= 1024 && unitIndex < units.size - 1) {
			currentSize /= 1024
			unitIndex++
		}
		
		return "%.2f %s".format(currentSize, units[unitIndex])
	}
}