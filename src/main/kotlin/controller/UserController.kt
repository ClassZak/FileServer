package org.zak.controller

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import org.zak.dto.CreateUserRequest
import org.zak.dto.CurrentUser
import org.zak.dto.LoginRequest
import org.zak.dto.PasswordUpdateResponse
import org.zak.dto.UpdatePasswordRequest
import org.zak.dto.UpdateUserRequest
import org.zak.entity.User
import org.zak.service.AdministratorService
import org.zak.service.UserService
import org.zak.util.JwtUtil

@RestController
@RequestMapping("/api/users")
class UserController(
	private val userService: UserService,
	private val administratorService: AdministratorService,
	private val jwtUtil: JwtUtil
) {
	
	@PostMapping("/register")
	fun register(@RequestBody request: CreateUserRequest): ResponseEntity<User> {
		return try {
			val user = userService.createUser(request)
			ResponseEntity(user, HttpStatus.CREATED)
		} catch (e: IllegalArgumentException) {
			ResponseEntity.badRequest().build()
		}
	}
	
	@PostMapping("/login")
	fun login(@RequestBody request: LoginRequest): ResponseEntity<Map<String, Any>> {
		val isAuthenticated = userService.authenticate(request)
		val response = mapOf(
			"authenticated" to isAuthenticated,
			"email" to request.email
		)
		
		if (isAuthenticated!=null) {
			return ResponseEntity.ok(response) as ResponseEntity<Map<String, Any>>
		} else {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response) as ResponseEntity<Map<String, Any>>
		}
	}
	
	
	@PostMapping("/new")
	@PreAuthorize("isAuthenticated()")
	fun new(
		@RequestBody request: CreateUserRequest,
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Map<String, Any>> {
		val jwtToken = jwtUtil.extractJwtToken(authHeader)
		val currUser = getCurrentUserFromJwt(jwtToken)
		
		val isAdmin = administratorService.isAdmin(currUser.id!!)
		if (!isAdmin)
			return ResponseEntity
				.status(HttpStatus.FORBIDDEN)
				.body(mapOf("error" to "Вы не являетесь админом"))
		
		return try {
			userService.createUser(request)
			ResponseEntity.ok(mapOf("success" to true))
		} catch (e: Exception) {
			ResponseEntity.badRequest().body(mapOf("error" to e.message)) as ResponseEntity<Map<String, Any>>
		}
	}
	
	
	@GetMapping("/user/{email}")
	@PreAuthorize("isAuthenticated()")
	fun read(
		@PathVariable email: String,
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Map<String, Any>> {
		val jwtToken = jwtUtil.extractJwtToken(authHeader)
		val currUser = getCurrentUserFromJwt(jwtToken)
		
		val isAdmin = administratorService.isAdmin(currUser.id!!)
		if (!isAdmin)
			return ResponseEntity
				.status(HttpStatus.FORBIDDEN)
				.body(mapOf("error" to "Вы не являетесь админом"))
		
		val user = userService.getUserEntityByEmail(email)
			?: return ResponseEntity
				.status(HttpStatus.NOT_FOUND)
				.body(mapOf("error" to "Пользователь не найден"))
		
		val response = userService.toUserResponse(user)
		
		return ResponseEntity.ok().body(mapOf("user" to response))
	}
	
	
	@PutMapping("/update/{email}")
	@PreAuthorize("isAuthenticated()")
	fun update(
		@PathVariable email: String,
		@RequestBody request: UpdateUserRequest,
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Map<String, Any>> {
		val jwtToken = jwtUtil.extractJwtToken(authHeader)
		val currUser = getCurrentUserFromJwt(jwtToken)
		
		val isAdmin = administratorService.isAdmin(currUser.id!!)
		if (!isAdmin)
			return ResponseEntity
				.status(HttpStatus.FORBIDDEN)
				.body(mapOf("error" to "Вы не являетесь админом"))
		
		val editUser = userService.getUserEntityByEmail(email)
			?: return ResponseEntity.status(HttpStatus.NOT_FOUND)
				.body(mapOf("error" to "Не найден пользователь для изменения"))
		
		return try {
			userService.updateUser(editUser.id!!.toLong(), request)
			ResponseEntity.ok().body(mapOf("success" to true))
		} catch (e: Exception) {
			ResponseEntity.badRequest().body(mapOf("error" to e.message)) as ResponseEntity<Map<String, Any>>
		}
	}
	
	
	@DeleteMapping("/delete/{email}")
	@PreAuthorize("isAuthenticated()")
	fun delete(
		@PathVariable email: String,
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Map<String, Any>> {
		val jwtToken = jwtUtil.extractJwtToken(authHeader)
		val currUser = getCurrentUserFromJwt(jwtToken)
		
		val isAdmin = administratorService.isAdmin(currUser.id!!)
		if (!isAdmin)
			return ResponseEntity
				.status(HttpStatus.FORBIDDEN)
				.body(mapOf("error" to "Вы не являетесь админом"))
		
		val editUser = userService.getUserEntityByEmail(email)
			?: return ResponseEntity.status(HttpStatus.NOT_FOUND)
				.body(mapOf("error" to "Не найден пользователь для изменения"))
		
		return try {
			userService.deleteUser(editUser)
			ResponseEntity.ok(mapOf("success" to true))
		} catch (e: Exception) {
			ResponseEntity.badRequest().body(mapOf("error" to e.message)) as ResponseEntity<Map<String, Any>>
		}
	}
	
	
	@PutMapping("/update-password/{email}")
	@PreAuthorize("isAuthenticated()")
	fun updatePassword(
		@PathVariable email: String,
		@RequestBody request: UpdatePasswordRequest,
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<PasswordUpdateResponse> {
		val jwtToken = jwtUtil.extractJwtToken(authHeader)
		val currUser = getCurrentUserFromJwt(jwtToken)
		if (!userService.hasPasswordUpdateAccess(currUser,email))
			return ResponseEntity.status(HttpStatus.FORBIDDEN)
				.body(PasswordUpdateResponse(success = false, message = "Недостаточно прав"))
		
		val editUser = userService.getUserEntityByEmail(email)
			?: return ResponseEntity.status(HttpStatus.NOT_FOUND)
				.body(PasswordUpdateResponse(success = false, message = "Не найден пользователь с предоставленной почтой для изменения пароля"))
		
		if (editUser.id == null)
			throw NullPointerException("Ошибка получения id пользователя")
		
		val validationResult = userService.validatePasswordChange(currUser, editUser.id!!.toLong(), request)
		
		try {
			return if (validationResult.valid){
				userService.updatePassword(currUser, editUser, request)
				ResponseEntity.ok((PasswordUpdateResponse(success = true, message = "Пароль успешно изменен")))
			}
			else
				ResponseEntity.ok((PasswordUpdateResponse(success = false, message = validationResult.message)))
		} catch (e: Exception) {
			val errorMessage = e.message
			return 	ResponseEntity.status(HttpStatus.NOT_FOUND)
				.body(PasswordUpdateResponse(success = false, message = errorMessage!!))
		}
	}
	
	
	
	
	@GetMapping("/users")
	@PreAuthorize("isAuthenticated()")
	fun readAll(
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Map<String, Any>> {
		val jwtToken = jwtUtil.extractJwtToken(authHeader)
		val currUser = getCurrentUserFromJwt(jwtToken)
		
		val isAdmin = administratorService.isAdmin(currUser.id!!)
		if (!isAdmin)
			return ResponseEntity
				.status(HttpStatus.FORBIDDEN)
				.body(mapOf("error" to "Вы не являетесь админом"))
		
		val users = userService.getAllUserForAdmin()
		
		return ResponseEntity.ok().body(mapOf("users" to users))
	}
	
	
	
	private fun getCurrentUserFromJwt(jwtToken: String): CurrentUser {
		// Валидация токена
		if (!jwtUtil.validateToken(jwtToken)) {
			throw Exception("Недействительный токен")
		}
		
		val userId = jwtUtil.extractUserId(jwtToken)
			?: throw Exception("User ID не найден в токене")
		
		val email = jwtUtil.extractUsername(jwtToken)
		
		val user = userService.getUserEntityById(userId.toLong())
		
		val isAdmin = administratorService.isAdmin(userId)
		
		return CurrentUser(
			id = userId,
			email = email,
			isAdmin = isAdmin,
			userDetails = user
		)
	}
}
