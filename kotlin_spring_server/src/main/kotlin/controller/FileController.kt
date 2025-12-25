package org.zak.controller


import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.core.io.FileSystemResource
import org.springframework.core.io.InputStreamResource
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import org.zak.dto.file.CreateFolderRequest
import org.zak.dto.file.FileSystemResponse
import org.zak.dto.file.FileUploadResponse
import org.zak.dto.file.DeleteRequest
import org.zak.service.FileSystemService
import org.zak.service.UserService
import java.io.FileInputStream
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import org.springframework.web.bind.annotation.*
import org.zak.dto.CurrentUser
import org.zak.service.AdministratorService
import org.zak.util.JwtUtil
import java.io.File

@RestController
@RequestMapping("/api/files")
class FileController(
	private val fileSystemService: FileSystemService,
	private val userService: UserService,
	private val jwtUtil: JwtUtil,
	private val administratorService: AdministratorService,
) {
	
	private val logger = LoggerFactory.getLogger(FileController::class.java)
	
	@GetMapping("/list")
	@PreAuthorize("isAuthenticated()")
	fun listDirectory(
		@RequestParam path: String = "",
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Any> {
		val currentUser = getCurrentUserFromJwt(authHeader)
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
			val exists = fileSystemService.pathExists(path)
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
		@RequestParam("file") file: MultipartFile,
		@RequestHeader("Authorization") authHeader: String
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
	
	@GetMapping("/search")
	fun searchFilesAndFolders(
		@RequestParam q: String,
		@RequestParam(required = false, defaultValue = "") path: String
	): ResponseEntity<Any> {
		return try {
			if (q.isBlank()) {
				return ResponseEntity.badRequest()
					.body(mapOf("error" to "Поисковый запрос не может быть пустым"))
			}
			
			val (files, folders) = fileSystemService.searchFilesAndFolders(q, path)
			ResponseEntity.ok(mapOf(
				"files" to files,
				"folders" to folders,
				"query" to q,
				"path" to path,
				"totalResults" to (files.size + folders.size)
			))
		} catch (e: IllegalArgumentException) {
			ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(mapOf("error" to (e.message ?: "Ошибка при поиске")))
		} catch (e: SecurityException) {
			ResponseEntity.status(HttpStatus.FORBIDDEN)
				.body(mapOf("error" to (e.message ?: "Нет прав доступа для поиска")))
		} catch (e: Exception) {
			logger.error("Ошибка при поиске файлов", e)
			ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(mapOf("error" to "Внутренняя ошибка сервера при поиске"))
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
	fun deleteFile(
		@RequestBody request: Map<String, String>,
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Any> {
		val path = request["path"] ?: ""
		val currentUser = getCurrentUserFromJwt(authHeader)
		
		return try {
			val success = fileSystemService.deleteByPermissionsAndSaveCopy(currentUser, path)
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
	
	
	
	
	
	private fun extractTokenFromHeader(authHeader: String): String {
		return if (authHeader.startsWith("Bearer ")) {
			authHeader.substring(7)
		} else {
			throw IllegalArgumentException("Неверный формат заголовка Authorization")
		}
	}
	private fun getCurrentUserFromJwt(authHeader: String): CurrentUser {
		val jwtToken = extractTokenFromHeader(authHeader)
		
		if (!jwtUtil.validateToken(jwtToken)) {
			throw SecurityException("Недействительный токен")
		}
		
		val userId = jwtUtil.extractUserId(jwtToken)
			?: throw SecurityException("User ID не найден в токене")
		
		val email = jwtUtil.extractUsername(jwtToken)
		val user = userService.getUserEntityById(userId)
		val isAdmin = administratorService.isAdmin(userId)
		
		return CurrentUser(
			id = userId,
			email = email,
			isAdmin = isAdmin,
			userDetails = user
		)
	}
	
}