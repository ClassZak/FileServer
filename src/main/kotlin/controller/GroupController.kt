package org.zak.controller

import org.zak.dto.CurrentUser
import org.zak.service.AdministratorService
import org.zak.service.GroupService
import org.zak.service.UserService
import org.zak.util.JwtUtil
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import jakarta.persistence.EntityNotFoundException

/**
 * Контроллер для управления группами пользователей.
 * Реализует разделение прав доступа:
 * - Пользователи: просмотр своих групп и их участников
 * - Администраторы: полный контроль над всеми группами
 *
 * Все эндпоинты требуют JWT-токен в заголовке Authorization.
 */
@RestController
@RequestMapping("/api/groups")
class GroupController(
	private val groupService: GroupService,
	private val userService: UserService,
	private val administratorService: AdministratorService,
	private val jwtUtil: JwtUtil
) {
	
	/**
	 * Получить все группы (только для администраторов)
	 */
	@GetMapping
	@PreAuthorize("isAuthenticated()")
	fun getAllGroups(@RequestHeader("Authorization") authHeader: String): ResponseEntity<Map<String, Any>> {
		val currentUser = getCurrentUserFromJwt(authHeader)
		
		if (!currentUser.isAdmin) {
			return errorResponse(HttpStatus.FORBIDDEN, "Требуются права администратора")
		}
		
		val groups = groupService.getAllGroups()
		return successResponse(mapOf("groups" to groups))
	}
	
	/**
	 * Получить группы текущего пользователя
	 */
	@GetMapping("/my")
	@PreAuthorize("isAuthenticated()")
	fun getMyGroups(@RequestHeader("Authorization") authHeader: String): ResponseEntity<Map<String, Any>> {
		val currentUser = getCurrentUserFromJwt(authHeader)
		val groups = groupService.getGroupsByUser(currentUser.id!!)
		return successResponse(mapOf("groups" to groups))
	}
	
	/**
	 * Получить информацию о группе по имени
	 */
	@GetMapping("/name/{groupName}")
	@PreAuthorize("isAuthenticated()")
	fun getGroupByName(
		@PathVariable groupName: String,
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Map<String, Any>> {
		val currentUser = getCurrentUserFromJwt(authHeader)
		val group = groupService.read(groupName) ?: return errorResponse(
			HttpStatus.NOT_FOUND,
			"Группа '$groupName' не найдена"
		)
		
		// Проверка прав доступа
		if (!currentUser.isAdmin && !groupService.isUserMemberOfGroup(currentUser.id!!, groupName)) {
			return errorResponse(HttpStatus.FORBIDDEN, "Вы не состоите в группе '$groupName'")
		}
		
		return successResponse(mapOf("group" to group))
	}
	
	/**
	 * Создать новую группу (только для администраторов)
	 */
	@PostMapping
	@PreAuthorize("isAuthenticated()")
	fun createGroup(
		@RequestBody request: CreateGroupRequest,
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Map<String, Any>> {
		val currentUser = getCurrentUserFromJwt(authHeader)
		
		if (!currentUser.isAdmin) {
			return errorResponse(HttpStatus.FORBIDDEN, "Требуются права администратора")
		}
		
		return try {
			val group = groupService.create(request.name, currentUser.id!!)
			ResponseEntity.status(HttpStatus.CREATED).body(mapOf("group" to group))
		} catch (e: IllegalArgumentException) {
			errorResponse(HttpStatus.BAD_REQUEST, e.message ?: "Ошибка создания группы")
		} catch (e: EntityNotFoundException) {
			errorResponse(HttpStatus.NOT_FOUND, e.message ?: "Пользователь не найден")
		}
	}
	
	/**
	 * Обновить информацию о группе по имени (только для администраторов)
	 */
	@PutMapping("/name/{groupName}")
	@PreAuthorize("isAuthenticated()")
	fun updateGroupByName(
		@PathVariable groupName: String,
		@RequestBody request: UpdateGroupByNameRequest,
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Map<String, Any>> {
		val currentUser = getCurrentUserFromJwt(authHeader)
		
		if (!currentUser.isAdmin) {
			return errorResponse(HttpStatus.FORBIDDEN, "Требуются права администратора")
		}
		
		return try {
			groupService.update(groupName, request.newName, request.creatorEmail)
			successResponse(mapOf("success" to true, "message" to "Группа обновлена"))
		} catch (e: IllegalArgumentException) {
			errorResponse(HttpStatus.BAD_REQUEST, e.message ?: "Ошибка обновления группы")
		} catch (e: EntityNotFoundException) {
			errorResponse(HttpStatus.NOT_FOUND, e.message ?: "Группа или пользователь не найдены")
		}
	}
	
	/**
	 * Удалить группу по имени (только для администраторов)
	 */
	@DeleteMapping("/name/{groupName}")
	@PreAuthorize("isAuthenticated()")
	fun deleteGroupByName(
		@PathVariable groupName: String,
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Map<String, Any>> {
		val currentUser = getCurrentUserFromJwt(authHeader)
		
		if (!currentUser.isAdmin) {
			return errorResponse(HttpStatus.FORBIDDEN, "Требуются права администратора")
		}
		
		val group = groupService.read(groupName) ?: return errorResponse(
			HttpStatus.NOT_FOUND,
			"Группа '$groupName' не найдена"
		)
		
		return try {
			groupService.delete(group)
			successResponse(mapOf("success" to true, "message" to "Группа '$groupName' удалена"))
		} catch (e: Exception) {
			errorResponse(HttpStatus.BAD_REQUEST, e.message ?: "Ошибка удаления группы")
		}
	}
	
	/**
	 * Получить участников группы по имени группы
	 */
	@GetMapping("/name/{groupName}/users")
	@PreAuthorize("isAuthenticated()")
	fun getGroupUsersByName(
		@PathVariable groupName: String,
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Map<String, Any>> {
		val currentUser = getCurrentUserFromJwt(authHeader)
		val group = groupService.read(groupName) ?: return errorResponse(
			HttpStatus.NOT_FOUND,
			"Группа '$groupName' не найдена"
		)
		
		// Проверка прав доступа
		if (!currentUser.isAdmin && !groupService.isUserMemberOfGroup(currentUser.id!!, groupName)) {
			return errorResponse(HttpStatus.FORBIDDEN, "Вы не состоите в группе '$groupName'")
		}
		
		val users = groupService.getUsers(group)
		return successResponse(mapOf("users" to users, "groupName" to groupName))
	}
	
	/**
	 * Добавить пользователя в группу по имени группы и email пользователя
	 */
	@PostMapping("/name/{groupName}/users/{userEmail}")
	@PreAuthorize("isAuthenticated()")
	fun addUserToGroupByEmail(
		@PathVariable groupName: String,
		@PathVariable userEmail: String,
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Map<String, Any>> {
		val currentUser = getCurrentUserFromJwt(authHeader)
		
		if (!currentUser.isAdmin) {
			return errorResponse(HttpStatus.FORBIDDEN, "Требуются права администратора")
		}
		
		return try {
			groupService.includeUserToGroupByEmail(userEmail, groupName)
			successResponse(mapOf(
				"success" to true,
				"message" to "Пользователь $userEmail добавлен в группу '$groupName'"
			))
		} catch (e: IllegalArgumentException) {
			errorResponse(HttpStatus.BAD_REQUEST, e.message ?: "Ошибка добавления пользователя")
		} catch (e: EntityNotFoundException) {
			errorResponse(HttpStatus.NOT_FOUND, e.message ?: "Группа или пользователь не найдены")
		}
	}
	
	/**
	 * Исключить пользователя из группы по имени группы и email пользователя
	 */
	@DeleteMapping("/name/{groupName}/users/{userEmail}")
	@PreAuthorize("isAuthenticated()")
	fun removeUserFromGroupByEmail(
		@PathVariable groupName: String,
		@PathVariable userEmail: String,
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Map<String, Any>> {
		val currentUser = getCurrentUserFromJwt(authHeader)
		
		if (!currentUser.isAdmin) {
			return errorResponse(HttpStatus.FORBIDDEN, "Требуются права администратора")
		}
		
		return try {
			groupService.excludeUserFromGroupByEmail(userEmail, groupName)
			successResponse(mapOf(
				"success" to true,
				"message" to "Пользователь $userEmail исключен из группы '$groupName'"
			))
		} catch (e: IllegalArgumentException) {
			errorResponse(HttpStatus.BAD_REQUEST, e.message ?: "Ошибка исключения пользователя")
		} catch (e: IllegalStateException) {
			errorResponse(HttpStatus.BAD_REQUEST, e.message ?: "Невозможно исключить создателя группы")
		} catch (e: EntityNotFoundException) {
			errorResponse(HttpStatus.NOT_FOUND, e.message ?: "Группа или пользователь не найдены")
		}
	}
	
	/**
	 * Проверить, состоит ли текущий пользователь в группе
	 */
	@GetMapping("/name/{groupName}/membership")
	@PreAuthorize("isAuthenticated()")
	fun checkMembership(
		@PathVariable groupName: String,
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Map<String, Any>> {
		val currentUser = getCurrentUserFromJwt(authHeader)
		
		val isMember = groupService.isUserMemberOfGroup(currentUser.id!!, groupName)
		val groupExists = groupService.read(groupName) != null
		
		return successResponse(mapOf(
			"isMember" to isMember,
			"groupExists" to groupExists,
			"groupName" to groupName
		))
	}
	
	/**
	 * Поиск групп по имени (для администраторов)
	 */
	@GetMapping("/search/{namePattern}")
	@PreAuthorize("isAuthenticated()")
	fun searchGroups(
		@PathVariable namePattern: String,
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Map<String, Any>> {
		val currentUser = getCurrentUserFromJwt(authHeader)
		
		if (!currentUser.isAdmin) {
			return errorResponse(HttpStatus.FORBIDDEN, "Требуются права администратора")
		}
		
		val groups = groupService.searchGroupsByName(namePattern)
		return successResponse(mapOf("groups" to groups, "pattern" to namePattern))
	}
	
	// Вспомогательные методы
	
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
	
	private fun extractTokenFromHeader(authHeader: String): String {
		return if (authHeader.startsWith("Bearer ")) {
			authHeader.substring(7)
		} else {
			throw IllegalArgumentException("Неверный формат заголовка Authorization")
		}
	}
	
	private fun errorResponse(status: HttpStatus, message: String): ResponseEntity<Map<String, Any>> {
		return ResponseEntity.status(status).body(mapOf("error" to message))
	}
	
	private fun successResponse(data: Map<String, Any>): ResponseEntity<Map<String, Any>> {
		return ResponseEntity.ok(data)
	}
}

/**
 * DTO для создания группы
 */
data class CreateGroupRequest(val name: String)

/**
 * DTO для обновления группы по имени
 */
data class UpdateGroupByNameRequest(
	val newName: String,          // Новое имя группы (может совпадать со старым)
	val creatorEmail: String      // Email нового создателя группы
)