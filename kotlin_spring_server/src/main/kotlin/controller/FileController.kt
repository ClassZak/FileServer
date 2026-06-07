package org.zak.controller

import jakarta.persistence.EntityNotFoundException
import org.slf4j.LoggerFactory
import org.springframework.core.io.FileSystemResource
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import org.zak.dto.CurrentUser
import org.zak.service.AdministratorService
import org.zak.service.FileSystemService
import org.zak.service.UserService
import org.zak.util.JwtUtil

/**
 * Контроллер для работы с файловой системой через REST API.
 * Все эндпоинты требуют аутентификации (JWT-токен в заголовке Authorization).
 *
 * Основные возможности:
 * - Просмотр содержимого директорий с учётом прав.
 * - Загрузка и скачивание файлов.
 * - Создание папок.
 * - Удаление в корзину с версионированием.
 * - Восстановление из корзины.
 * - Окончательное удаление (только для администратора).
 * - Управление правами доступа к папкам и файлам.
 * - Просмотр истории операций.
 * - Просмотр списка удалённых файлов и папок.
 */
@RestController
@RequestMapping("/api/files")
class FileController(
	private val fileSystemService: FileSystemService,
	private val userService: UserService,
	private val jwtUtil: JwtUtil,
	private val administratorService: AdministratorService,
) {
	
	private val logger = LoggerFactory.getLogger(FileController::class.java)
	
	// ================== ОСНОВНЫЕ ОПЕРАЦИИ С ФАЙЛАМИ ==================
	
	/**
	 * Получить список файлов и папок в заданной директории.
	 *
	 * @param path относительный путь к директории (по умолчанию "" – корень).
	 * @param authHeader заголовок Authorization с Bearer токеном.
	 * @return JSON с полями `files` (массив FileInfo) и `folders` (массив FolderInfo).
	 * @throws 400 Bad Request – если директория не существует.
	 * @throws 403 Forbidden – нет прав на чтение.
	 */
	@GetMapping("/list")
	@PreAuthorize("isAuthenticated()")
	fun listDirectory(
		@RequestParam path: String = "",
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Any> {
		return try {
			val currentUser = getCurrentUserFromJwt(authHeader)
			val (files, folders) = fileSystemService.listDirectoryByPermissions(currentUser, path)
			ResponseEntity.ok(mapOf("files" to files, "folders" to folders))
		} catch (e: IllegalArgumentException) {
			ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(mapOf("error" to (e.message ?: "Директория не найдена")))
		} catch (e: SecurityException) {
			ResponseEntity.status(HttpStatus.FORBIDDEN)
				.body(mapOf("error" to (e.message ?: "У вас нет прав доступа к этой директории")))
		} catch (e: Exception) {
			logger.error("Ошибка при получении списка файлов", e)
			ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(mapOf("error" to "Внутренняя ошибка сервера"))
		}
	}
	
	/**
	 * Проверить существование файла или папки по указанному пути с учётом прав текущего пользователя.
	 *
	 * @param path путь для проверки.
	 * @param authHeader заголовок Authorization с Bearer токеном.
	 * @return JSON с полем `exists` (true/false). В случае ошибки также возвращается `exists: false`.
	 */
	@GetMapping("/exists")
	fun existsFileOrDirectory(
		@RequestParam path: String = "",
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Any> {
		try {
			val currentUser = getCurrentUserFromJwt(authHeader)
			val exists = fileSystemService.pathExistsByPermissions(currentUser, path)
			return if (exists)
				ResponseEntity.ok(mapOf("exists" to true))
			else
				ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("exists" to false))
		} catch (e: Exception) {
			logger.error("Ошибка при поиске файла или директории", e)
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("exists" to false))
		}
	}
	
	/**
	 * Загрузить файл в указанную директорию.
	 *
	 * @param path целевая директория (по умолчанию корень).
	 * @param file MultipartFile – загружаемый файл.
	 * @param authHeader заголовок Authorization с Bearer токеном.
	 * @return JSON с информацией о загруженном файле (FileInfo).
	 * @throws 400 Bad Request – ошибка валидации (например, файл уже существует).
	 * @throws 403 Forbidden – нет прав на создание.
	 */
	@PostMapping("/upload")
	fun uploadFile(
		@RequestParam path: String = "",
		@RequestParam("file") file: MultipartFile,
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Any> {
		return try {
			val currentUser = getCurrentUserFromJwt(authHeader)
			val fileInfo = fileSystemService.uploadFileByPermissions(currentUser, path, file)
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
				.body(mapOf("error" to (e.message ?: "Ошибка при загрузке файла")))
		}
	}
	
	/**
	 * Скачать файл по указанному пути.
	 *
	 * @param path путь к файлу.
	 * @param authHeader заголовок Authorization с Bearer токеном.
	 * @return поток файла с соответствующим Content-Type и заголовком Content-Disposition.
	 * @throws 404 Not Found – файл не найден.
	 * @throws 403 Forbidden – нет прав на чтение.
	 */
	@GetMapping("/download")
	fun downloadFile(
		@RequestParam path: String,
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Any> {
		val currentUser = getCurrentUserFromJwt(authHeader)
		return try {
			val (file, contentType) = fileSystemService.downloadFileByPermissions(currentUser, path)
			
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
	
	/**
	 * Создать новую папку.
	 *
	 * @param request тело запроса с полями `path` (родительская директория) и `folderName` (имя папки).
	 * @param authHeader заголовок Authorization с Bearer токеном.
	 * @return JSON с информацией о созданной папке (FolderInfo).
	 * @throws 400 Bad Request – ошибка валидации (например, папка уже существует).
	 * @throws 403 Forbidden – нет прав на создание.
	 */
	@PostMapping("/create-folder")
	fun createFolder(
		@RequestBody request: Map<String, String>,
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Any> {
		val currentUser = getCurrentUserFromJwt(authHeader)
		val path = request["path"] ?: ""
		val folderName = request["folderName"] ?: ""
		
		return try {
			val folderInfo = fileSystemService.createFolderByPermissions(currentUser, path, folderName)
			ResponseEntity.ok(folderInfo)
		} catch (e: IllegalArgumentException) {
			ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(mapOf("error" to (e.message ?: "Ошибка при создании директории")))
		} catch (e: SecurityException) {
			ResponseEntity.status(HttpStatus.FORBIDDEN)
				.body(mapOf("error" to (e.message ?: "Нет прав доступа для создания директории")))
		} catch (e: Exception) {
			logger.error("Ошибка при создании директории", e)
			ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(mapOf("error" to (e.message ?: "Ошибка при создании директории")))
		}
	}
	
	/**
	 * Удалить файл или папку (переместить в корзину с версионированием).
	 *
	 * @param path путь к удаляемому элементу.
	 * @param authHeader заголовок Authorization с Bearer токеном.
	 * @return JSON с сообщением об успехе.
	 * @throws 400 Bad Request – элемент не найден.
	 * @throws 403 Forbidden – нет прав на удаление.
	 */
	@DeleteMapping("/delete")
	fun deleteFile(
		@RequestParam path: String,
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Any> {
		val currentUser = getCurrentUserFromJwt(authHeader)
		
		return try {
			val success = fileSystemService.deleteByPermissionsAndSaveCopy(currentUser, path)
			if (success) {
				ResponseEntity.ok(mapOf("message" to "Удалено успешно"))
			} else {
				ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body(mapOf("error" to "Не удалось удалить файл/директорию"))
			}
		} catch (e: IllegalArgumentException) {
			ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(mapOf("error" to (e.message ?: "Файл или директория не найдены")))
		} catch (e: SecurityException) {
			ResponseEntity.status(HttpStatus.FORBIDDEN)
				.body(mapOf("error" to (e.message ?: "Нет прав доступа для удаления")))
		} catch (e: Exception) {
			logger.error("Ошибка при удалении", e)
			ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(mapOf("error" to (e.message ?: "Ошибка при удалении")))
		}
	}
	
	/**
	 * Скачать удалённый файл из корзины по оригинальному пути и версии.
	 *
	 * @param path оригинальный путь файла до удаления.
	 * @param version версия файла в корзине.
	 * @param authHeader заголовок Authorization с Bearer токеном.
	 * @return поток файла с соответствующим Content-Type и заголовком Content-Disposition.
	 * @throws 404 Not Found – запись об удалённом файле или физический файл не найдены.
	 * @throws 403 Forbidden – нет прав на чтение.
	 */
	@GetMapping("/download/deleted")
	fun downloadDeletedFile(
		@RequestParam path: String,
		@RequestParam version: Int,
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Any> {
		val currentUser = getCurrentUserFromJwt(authHeader)
		return try {
			val (file, contentType) = fileSystemService.downloadDeletedFileByPermissions(currentUser, path, version)
			
			val resource = FileSystemResource(file)
			ResponseEntity.ok()
				.contentType(MediaType.parseMediaType(contentType))
				.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"${file.name}\"")
				.body(resource)
		} catch (e: IllegalArgumentException) {
			ResponseEntity.status(HttpStatus.NOT_FOUND)
				.body(mapOf("error" to (e.message ?: "Удалённый файл не найден")))
		} catch (e: SecurityException) {
			ResponseEntity.status(HttpStatus.FORBIDDEN)
				.body(mapOf("error" to (e.message ?: "Нет прав доступа для скачивания удалённого файла")))
		} catch (e: IllegalStateException) {
			ResponseEntity.status(HttpStatus.NOT_FOUND)
				.body(mapOf("error" to (e.message ?: "Файл не найден в корзине")))
		} catch (e: Exception) {
			logger.error("Ошибка при скачивании удалённого файла", e)
			ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(mapOf("error" to "Ошибка при скачивании файла"))
		}
	}
	
	/**
	 * Поиск файлов и папок по подстроке в имени.
	 *
	 * @param q строка поиска (обязательно).
	 * @param path базовая директория для поиска (по умолчанию корень).
	 * @param authHeader заголовок Authorization с Bearer токеном.
	 * @return JSON с полями `files`, `folders`, `query`, `path`, `totalResults`.
	 * @throws 400 Bad Request – пустой поисковый запрос.
	 * @throws 403 Forbidden – нет прав на чтение в базовой директории.
	 */
	@GetMapping("/search")
	fun searchFilesAndFolders(
		@RequestParam q: String,
		@RequestParam(required = false, defaultValue = "") path: String,
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Any> {
		return try {
			val currentUser = getCurrentUserFromJwt(authHeader)
			if (q.isBlank()) {
				return ResponseEntity.badRequest()
					.body(mapOf("error" to "Поисковый запрос не может быть пустым"))
			}
			
			val (files, folders) = fileSystemService.searchFilesAndFoldersByPermissions(currentUser, q, path)
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
				.body(mapOf("error" to (e.message ?: "Внутренняя ошибка сервера при поиске")))
		}
	}
	
	// ================== КОРЗИНА И ВОССТАНОВЛЕНИЕ ==================
	
	/**
	 * Получить список удалённых файлов, доступных текущему пользователю.
	 *
	 * @param authHeader заголовок Authorization с Bearer токеном.
	 * @return JSON с полем `deletedFiles` (массив DeletedFileInfo).
	 */
	@GetMapping("/deleted/files")
	@PreAuthorize("isAuthenticated()")
	fun getDeletedFiles(@RequestHeader("Authorization") authHeader: String): ResponseEntity<Any> {
		val currentUser = getCurrentUserFromJwt(authHeader)
		val deleted = fileSystemService.getDeletedFilesForUser(currentUser)
		return ResponseEntity.ok(mapOf("deletedFiles" to deleted))
	}
	
	/**
	 * Получить список удалённых папок, доступных текущему пользователю.
	 *
	 * @param authHeader заголовок Authorization с Bearer токеном.
	 * @return JSON с полем `deletedFolders` (массив DeletedFolderInfo).
	 */
	@GetMapping("/deleted/folders")
	@PreAuthorize("isAuthenticated()")
	fun getDeletedFolders(@RequestHeader("Authorization") authHeader: String): ResponseEntity<Any> {
		val currentUser = getCurrentUserFromJwt(authHeader)
		val deleted = fileSystemService.getDeletedFoldersForUser(currentUser)
		return ResponseEntity.ok(mapOf("deletedFolders" to deleted))
	}
	
	/**
	 * Получить список версий удалённого файла, доступных текущему пользователю.
	 *
	 * @param parentPath родительская папка файла.
	 * @param fileName имя файла.
	 * @param authHeader заголовок Authorization с Bearer токеном.
	 * @return JSON с полем `versions` (массив DeletedFileInfo).
	 * @throws 404 Not Found – файл не найден или не был удалён.
	 * @throws 403 Forbidden – нет прав на чтение файла.
	 */
	@GetMapping("/deleted/file/versions")
	@PreAuthorize("isAuthenticated()")
	fun getDeletedFileVersions(
		@RequestHeader("Authorization") authHeader: String,
		@RequestParam parentPath: String,
		@RequestParam fileName: String
	): ResponseEntity<Any> {
		try {
			val currentUser = getCurrentUserFromJwt(authHeader)
			val versions = fileSystemService.getDeletedFileVersionsForUser(currentUser, parentPath, fileName)
			return ResponseEntity.ok(mapOf("versions" to versions))
		} catch (e: Exception) {
			return handleException(e)
		}
	}
	
	/**
	 * Получить список версий удалённой папки, доступных текущему пользователю.
	 *
	 * @param path путь к папке.
	 * @param authHeader заголовок Authorization с Bearer токеном.
	 * @return JSON с полем `versions` (массив DeletedFolderInfo).
	 * @throws 404 Not Found – папка не найдена или не была удалена.
	 * @throws 403 Forbidden – нет прав на чтение папки.
	 */
	@GetMapping("/deleted/folder/versions")
	@PreAuthorize("isAuthenticated()")
	fun getDeletedFolderVersions(
		@RequestHeader("Authorization") authHeader: String,
		@RequestParam path: String
	): ResponseEntity<Any> {
		try {
			val currentUser = getCurrentUserFromJwt(authHeader)
			val versions = fileSystemService.getDeletedFolderVersionsForUser(currentUser, path)
			return ResponseEntity.ok(mapOf("versions" to versions))
		} catch (e: Exception) {
			return handleException(e)
		}
	}
	
	/**
	 * Восстановить файл из корзины по указанному пути и версии.
	 *
	 * @param request объект RestoreFileRequest с полями originalPath, version.
	 * @param authHeader заголовок Authorization с Bearer токеном.
	 * @return JSON с сообщением об успехе.
	 * @throws 404 Not Found – запись не найдена.
	 * @throws 403 Forbidden – нет прав на восстановление.
	 * @throws 409 Conflict – файл уже восстановлен или оригинальный путь занят.
	 */
	@PostMapping("/restore/file")
	@PreAuthorize("isAuthenticated()")
	fun restoreFile(
		@RequestBody request: RestoreFileRequest,
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Any> {
		val currentUser = getCurrentUserFromJwt(authHeader)
		return try {
			val success = fileSystemService.restoreFile(currentUser, request.originalPath, request.version)
			ResponseEntity.ok(mapOf("success" to success, "message" to "Файл восстановлен"))
		} catch (e: Exception) {
			handleException(e)
		}
	}
	
	/**
	 * Восстановить папку из корзины по указанному пути и версии.
	 *
	 * @param request объект RestoreFolderRequest с полями originalPath, version.
	 * @param authHeader заголовок Authorization с Bearer токеном.
	 * @return JSON с сообщением об успехе.
	 * @throws 404 Not Found – запись не найдена.
	 * @throws 403 Forbidden – нет прав на восстановление.
	 * @throws 409 Conflict – папка уже восстановлена или оригинальный путь занят.
	 */
	@PostMapping("/restore/folder")
	@PreAuthorize("isAuthenticated()")
	fun restoreFolder(
		@RequestBody request: RestoreFolderRequest,
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Any> {
		val currentUser = getCurrentUserFromJwt(authHeader)
		return try {
			val success = fileSystemService.restoreFolder(currentUser, request.originalPath, request.version)
			ResponseEntity.ok(mapOf("success" to success, "message" to "Папка восстановлена"))
		} catch (e: Exception) {
			handleException(e)
		}
	}
	
	/**
	 * Окончательно удалить файл и все его версии из корзины (только для администратора).
	 *
	 * @param path оригинальный путь файла.
	 * @param authHeader заголовок Authorization с Bearer токеном.
	 * @return JSON с сообщением об успехе.
	 * @throws 403 Forbidden – не администратор.
	 * @throws 404 Not Found – файл не найден в БД.
	 */
	@DeleteMapping("/permanent/file")
	@PreAuthorize("isAuthenticated()")
	fun permanentDeleteFile(
		@RequestParam path: String,
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Any> {
		val currentUser = getCurrentUserFromJwt(authHeader)
		return try {
			fileSystemService.permanentDeleteFileByPath(path, currentUser)
			ResponseEntity.ok(mapOf("success" to true, "message" to "Файл и все его версии окончательно удалены"))
		} catch (e: Exception) {
			handleException(e)
		}
	}
	
	/**
	 * Окончательно удалить папку и все её версии из корзины (только для администратора).
	 *
	 * @param path оригинальный путь папки.
	 * @param authHeader заголовок Authorization с Bearer токеном.
	 * @return JSON с сообщением об успехе.
	 * @throws 403 Forbidden – не администратор.
	 * @throws 404 Not Found – папка не найдена в БД.
	 */
	@DeleteMapping("/permanent/folder")
	@PreAuthorize("isAuthenticated()")
	fun permanentDeleteFolder(
		@RequestParam path: String,
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Any> {
		val currentUser = getCurrentUserFromJwt(authHeader)
		return try {
			fileSystemService.permanentDeleteFolderByPath(path, currentUser)
			ResponseEntity.ok(mapOf("success" to true, "message" to "Папка и все её версии окончательно удалены"))
		} catch (e: Exception) {
			handleException(e)
		}
	}
	
	// ================== УПРАВЛЕНИЕ ПРАВАМИ ==================
	
	// ================== ПРОСМОТР ПРАВ =======================
	@GetMapping("/permissions/folder")
	@PreAuthorize("isAuthenticated()")
	fun getFolderPermissions(
		@RequestParam path: String,
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Any> {
		val currentUser = getCurrentUserFromJwt(authHeader)
		return try {
			val permissions = fileSystemService.getFolderPermissions(path, currentUser)
			ResponseEntity.ok(mapOf("permissions" to permissions))
		} catch (e: Exception) {
			handleException(e)
		}
	}
	
	@GetMapping("/permissions/file")
	@PreAuthorize("isAuthenticated()")
	fun getFilePermissions(
		@RequestParam path: String,
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Any> {
		val currentUser = getCurrentUserFromJwt(authHeader)
		return try {
			val permissions = fileSystemService.getFilePermissions(path, currentUser)
			ResponseEntity.ok(mapOf("permissions" to permissions))
		} catch (e: Exception) {
			handleException(e)
		}
	}
	
	@GetMapping("/permissions/group/{groupName}")
	@PreAuthorize("isAuthenticated()")
	fun getGroupPermissions(
		@PathVariable groupName: String,
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Any> {
		val currentUser = getCurrentUserFromJwt(authHeader)
		return try {
			val permissions = fileSystemService.getGroupPermissions(groupName, currentUser)
			ResponseEntity.ok(mapOf("permissions" to permissions))
		} catch (e: Exception) {
			handleException(e)
		}
	}
	
	@GetMapping("/permissions/user/{userEmail}")
	@PreAuthorize("isAuthenticated()")
	fun getUserPermissions(
		@PathVariable userEmail: String,
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Any> {
		val currentUser = getCurrentUserFromJwt(authHeader)
		return try {
			val permissions = fileSystemService.getUserPermissions(userEmail, currentUser)
			ResponseEntity.ok(mapOf("permissions" to permissions))
		} catch (e: Exception) {
			handleException(e)
		}
	}
	/**
	 * Установить или обновить права доступа на папку.
	 *
	 * @param request объект SetPermissionRequest с полями path, userId, groupId, mode.
	 * @param authHeader заголовок Authorization с Bearer токеном.
	 * @return JSON с сообщением об успехе.
	 * @throws 400 Bad Request – неверные параметры (например, указаны оба userId и groupId).
	 * @throws 403 Forbidden – нет прав на изменение разрешений.
	 * @throws 404 Not Found – папка не найдена.
	 */
	@PutMapping("/permissions/folder")
	@PreAuthorize("isAuthenticated()")
	fun setFolderPermission(@RequestBody request: SetPermissionRequest, @RequestHeader("Authorization") authHeader: String): ResponseEntity<Any> {
		val currentUser = getCurrentUserFromJwt(authHeader)
		return try {
			fileSystemService.setFolderPermission(request.path, request.userEmail, request.groupName, request.mode, currentUser)
			ResponseEntity.ok(mapOf("success" to true))
		} catch (e: Exception) {
			handleException(e)
		}
	}
	
	/**
	 * Удалить явное разрешение на папку.
	 *
	 * @param path путь к папке.
	 * @param userEmail почта пользователя, для которого удаляется запись (опционально).
	 * @param groupName имя группы, для которой удаляется запись (опционально).
	 * @param authHeader заголовок Authorization с Bearer токеном.
	 * @return JSON с сообщением об успехе.
	 * @throws 403 Forbidden – нет прав на изменение разрешений.
	 * @throws 404 Not Found – разрешение не найдено.
	 */
	@DeleteMapping("/permissions/folder")
	@PreAuthorize("isAuthenticated()")
	fun deleteFolderPermission(
		@RequestParam path: String,
		@RequestParam userEmail: String?,
		@RequestParam groupName: String?,
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Any> {
		val currentUser = getCurrentUserFromJwt(authHeader)
		return try {
			fileSystemService.deleteFolderPermission(path, userEmail, groupName, currentUser)
			ResponseEntity.ok(mapOf("success" to true))
		} catch (e: Exception) {
			handleException(e)
		}
	}
	
	/**
	 * Установить или обновить права доступа на файл.
	 *
	 * @param request объект SetPermissionRequest с полями path, userId, groupId, mode.
	 * @param authHeader заголовок Authorization с Bearer токеном.
	 * @return JSON с сообщением об успехе.
	 * @throws 400 Bad Request – неверные параметры (например, указаны оба userId и groupId).
	 * @throws 403 Forbidden – нет прав на изменение разрешений.
	 * @throws 404 Not Found – файл не найден.
	 */
	@PutMapping("/permissions/file")
	@PreAuthorize("isAuthenticated()")
	fun setFilePermission(@RequestBody request: SetPermissionRequest, @RequestHeader("Authorization") authHeader: String): ResponseEntity<Any> {
		val currentUser = getCurrentUserFromJwt(authHeader)
		return try {
			fileSystemService.setFilePermission(request.path, request.userEmail, request.groupName, request.mode, currentUser)
			ResponseEntity.ok(mapOf("success" to true))
		} catch (e: Exception) {
			handleException(e)
		}
	}
	
	/**
	 * Удалить явное разрешение на файл по идентификатору.
	 *
	 * @param path путь разрешения (FilePermission).
	 * @param userEmail пользователь, для которого удаляется запись
	 * @param groupName группа, для которой удаляется запись
	 * @param authHeader заголовок Authorization с Bearer токеном.
	 * @return JSON с сообщением об успехе.
	 * @throws 403 Forbidden – нет прав на изменение разрешений.
	 * @throws 404 Not Found – разрешение не найдено.
	 */
	@DeleteMapping("/permissions/file")
	@PreAuthorize("isAuthenticated()")
	fun deleteFilePermission(
		@RequestParam path: String,
		@RequestParam userEmail: String?,
		@RequestParam groupName: String?,
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Any> {
		val currentUser = getCurrentUserFromJwt(authHeader)
		return try {
			fileSystemService.deleteFilePermission(path, userEmail, groupName, currentUser)
			ResponseEntity.ok(mapOf("success" to true))
		} catch (e: Exception) {
			handleException(e)
		}
	}
	
	// ================== ИСТОРИЯ ==================
	
	/**
	 * Получить историю операций с возможностью фильтрации.
	 *
	 * @param userEmail (опционально) фильтр по почте пользователя.
	 * @param pathPrefix (опционально) фильтр по префиксу пути.
	 * @param isFile (опционально) фильтр по типу: true – файлы, false – папки.
	 * @param authHeader заголовок Authorization с Bearer токеном.
	 * @return JSON с полем `history` (массив WorkHistory).
	 * @throws 403 Forbidden – попытка просмотра чужой истории не администратором.
	 */
	@GetMapping("/history")
	@PreAuthorize("isAuthenticated()")
	fun getHistory(
		@RequestParam(required = false) userEmail: String?,
		@RequestParam(required = false) pathPrefix: String?,
		@RequestParam(required = false) isFile: Boolean?,
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Any> {
		val currentUser = getCurrentUserFromJwt(authHeader)
		
		if (!currentUser.isAdmin && userEmail != null && userEmail != currentUser.email) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body(mapOf("error" to "Нет прав на просмотр чужой истории"))
		}
		
		val targetUserId: Int? = if (currentUser.isAdmin) {
			// Администратор может фильтровать по конкретному пользователю или смотреть всю историю
			if (userEmail != null) {
				val user = userService.getUserByEmail(userEmail)
				user?.id ?: return ResponseEntity.status(HttpStatus.NOT_FOUND)
					.body(mapOf("error" to "Пользователь с email '$userEmail' не найден"))
			} else {
				null   // без фильтра – вся история
			}
		} else {
			// Обычный пользователь может смотреть только свою историю
			currentUser.id!!
		}
		
		val filter = FileSystemService.HistoryFilter(
			userId = targetUserId,
			pathPrefix = pathPrefix,
			isFile = isFile
		)
		
		val history = fileSystemService.getWorkHistory(filter)
		return ResponseEntity.ok(mapOf("history" to history))
	}
	
	// ================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ==================
	
	/**
	 * Глобальный обработчик исключений для данного контроллера.
	 * Преобразует исключения в соответствующие HTTP-статусы и сообщения.
	 */
	@ExceptionHandler(Exception::class)
	fun handleGlobalException(ex: Exception): ResponseEntity<Map<String, String>> {
		logger.error("Необработанная ошибка", ex)
		
		return when (ex) {
			is IllegalArgumentException -> ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(mapOf("error" to (ex.message ?: "Некорректный запрос")))
			is SecurityException -> ResponseEntity.status(HttpStatus.FORBIDDEN)
				.body(mapOf("error" to (ex.message ?: "Доступ запрещен")))
			else -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(mapOf("error" to "Внутренняя ошибка сервера"))
		}
	}
	
	/** Обрабатывает исключения, специфичные для операций с файлами. */
	private fun handleException(e: Exception): ResponseEntity<Any> {
		return when (e) {
			is IllegalArgumentException -> ResponseEntity.badRequest().body(mapOf("error" to e.message))
			is SecurityException -> ResponseEntity.status(HttpStatus.FORBIDDEN).body(mapOf("error" to e.message))
			is EntityNotFoundException -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("error" to e.message))
			is IllegalStateException -> ResponseEntity.status(HttpStatus.CONFLICT).body(mapOf("error" to e.message))
			else -> {
				logger.error("Внутренняя ошибка", e)
				ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf("error" to "Внутренняя ошибка сервера"))
			}
		}
	}
	
	/** Извлекает JWT-токен из заголовка Authorization. */
	private fun extractTokenFromHeader(authHeader: String): String {
		return if (authHeader.startsWith("Bearer ")) {
			authHeader.substring(7)
		} else {
			throw IllegalArgumentException("Неверный формат заголовка Authorization")
		}
	}
	
	/** Получает объект CurrentUser из JWT-токена. */
	private fun getCurrentUserFromJwt(authHeader: String): CurrentUser {
		val jwtToken = extractTokenFromHeader(authHeader)
		
		if (!jwtUtil.validateToken(jwtToken)) {
			throw SecurityException("Недействительный токен")
		}
		val userId = jwtUtil.extractUserId(jwtToken) ?: throw SecurityException("User ID не найден в токене")
		val email = jwtUtil.extractUsername(jwtToken)
		val user = userService.getUserEntityById(userId)
		val isAdmin = administratorService.isAdmin(userId)
		return CurrentUser(id = userId, email = email, isAdmin = isAdmin, userDetails = user)
	}
}

/**
 * DTO для запроса на установку прав доступа.
 */
data class SetPermissionRequest(
	val path: String,
	val userEmail: String?,
	val groupName: String?,
	val mode: Int
)
/**
 * DTO для запроса на восстановление файла.
 */
data class RestoreFileRequest(
	val originalPath: String,
	val version: Int = 1
)

/**
 * DTO для запроса на восстановление папки.
 */
data class RestoreFolderRequest(
	val originalPath: String,
	val version: Int = 1
)