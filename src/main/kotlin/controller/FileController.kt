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
import org.springframework.web.bind.annotation.*
import java.io.File

@RestController
@RequestMapping("/api/files")
class FileController(private val fileSystemService: FileSystemService) {
	
	private val logger = LoggerFactory.getLogger(FileController::class.java)
	
	@GetMapping("/list")
	fun listDirectory(@RequestParam path: String = ""): ResponseEntity<Any> {
		return try {
			val (files, folders) = fileSystemService.listDirectory(path)
			ResponseEntity.ok(mapOf("files" to files, "folders" to folders))
		} catch (e: IllegalArgumentException) {
			// Директория не существует
			ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(mapOf("error" to (e.message ?: "Директория не найдена")))
		} catch (e: SecurityException) {
			// Нет прав доступа
			ResponseEntity.status(HttpStatus.FORBIDDEN)
				.body(mapOf("error" to (e.message ?: "У вас нет прав доступа к этой директории")))
		} catch (e: Exception) {
			logger.error("Ошибка при получении списка файлов", e)
			ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(mapOf("error" to "Внутренняя ошибка сервера"))
		}
	}
	
	@GetMapping("/exists")
	fun existsFileOrDirectory(@RequestParam path: String = "") : ResponseEntity<Any> {
		try {
			val exists = fileSystemService.pathExistsPub(path)
			return if (exists)
				ResponseEntity.ok(mapOf("exists" to true))
			else
				ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("exists" to false))
		} catch (e: Exception) {
			logger.error("Ошибка при поиске файла или папки", e)
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("exists" to false))
		}
	}
	
	@PostMapping("/upload")
	fun uploadFile(
		@RequestParam path: String = "",
		@RequestParam("file") file: MultipartFile
	): ResponseEntity<Any> {
		return try {
			val fileInfo = fileSystemService.uploadFile(path, file)
			ResponseEntity.ok(fileInfo)
		} catch (e: IllegalArgumentException) {
			ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(mapOf("error" to (e.message ?: "Ошибка при загрузке файла")))
		} catch (e: SecurityException) {
			ResponseEntity.status(HttpStatus.FORBIDDEN)
				.body(mapOf("error" to (e.message ?: "Нет прав доступа для загрузки файла")))
		} catch (e: Exception) {
			logger.error("Ошибка при загрузке файла", e)
			ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(mapOf("error" to "Ошибка при загрузке файла"))
		}
	}
	
	@PostMapping("/create-folder")
	fun createFolder(@RequestBody request: Map<String, String>): ResponseEntity<Any> {
		val path = request["path"] ?: ""
		val folderName = request["folderName"] ?: ""
		
		return try {
			val folderInfo = fileSystemService.createFolder(path, folderName)
			ResponseEntity.ok(folderInfo)
		} catch (e: IllegalArgumentException) {
			ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(mapOf("error" to (e.message ?: "Ошибка при создании папки")))
		} catch (e: SecurityException) {
			ResponseEntity.status(HttpStatus.FORBIDDEN)
				.body(mapOf("error" to (e.message ?: "Нет прав доступа для создания папки")))
		} catch (e: Exception) {
			logger.error("Ошибка при создании папки", e)
			ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(mapOf("error" to "Ошибка при создании папки"))
		}
	}
	
	@DeleteMapping("/delete")
	fun deleteFile(@RequestBody request: Map<String, String>): ResponseEntity<Any> {
		val path = request["path"] ?: ""
		
		return try {
			val success = fileSystemService.delete(path)
			if (success) {
				ResponseEntity.ok(mapOf("message" to "Удалено успешно"))
			} else {
				ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body(mapOf("error" to "Не удалось удалить файл/папку"))
			}
		} catch (e: IllegalArgumentException) {
			ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(mapOf("error" to (e.message ?: "Файл или папка не найдены")))
		} catch (e: SecurityException) {
			ResponseEntity.status(HttpStatus.FORBIDDEN)
				.body(mapOf("error" to (e.message ?: "Нет прав доступа для удаления")))
		} catch (e: Exception) {
			logger.error("Ошибка при удалении", e)
			ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(mapOf("error" to "Ошибка при удалении"))
		}
	}
	
	@GetMapping("/download")
	fun downloadFile(@RequestParam path: String): ResponseEntity<Any> {
		return try {
			val (file, contentType) = fileSystemService.downloadFile(path)
			
			val resource = FileSystemResource(file)
			
			ResponseEntity.ok()
				.contentType(MediaType.parseMediaType(contentType))
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"${file.name}\"")
				.body(resource)
		} catch (e: IllegalArgumentException) {
			ResponseEntity.status(HttpStatus.NOT_FOUND)
				.body(mapOf("error" to (e.message ?: "Файл не найден")))
		} catch (e: SecurityException) {
			ResponseEntity.status(HttpStatus.FORBIDDEN)
				.body(mapOf("error" to (e.message ?: "Нет прав доступа для скачивания файла")))
		} catch (e: Exception) {
			logger.error("Ошибка при скачивании файла", e)
			ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(mapOf("error" to "Ошибка при скачивании файла"))
		}
	}
	
	@ExceptionHandler(Exception::class)
	fun handleGlobalException(ex: Exception): ResponseEntity<Map<String, String>> {
		logger.error("Необработанная ошибка", ex)
		
		return when (ex) {
			is IllegalArgumentException -> {
				ResponseEntity.status(HttpStatus.BAD_REQUEST)
					.body(mapOf("error" to (ex.message ?: "Некорректный запрос")))
			}
			is SecurityException -> {
				ResponseEntity.status(HttpStatus.FORBIDDEN)
					.body(mapOf("error" to (ex.message ?: "Доступ запрещен")))
			}
			else -> {
				ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body(mapOf("error" to "Внутренняя ошибка сервера"))
			}
		}
	}
}