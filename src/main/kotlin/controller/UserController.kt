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
import org.zak.dto.UserResponse
import org.zak.repository.AdministratorRepository
import org.zak.service.UserService
import org.zak.util.JwtUtil

@RestController
@RequestMapping("/api/users")
class UserController(
	private val userService: UserService,
	private val administratorRepository: AdministratorRepository,
	//private val adminService:
	private val jwtUtil: JwtUtil
) {
	
	@PostMapping("/register")
	fun register(@RequestBody request: CreateUserRequest): ResponseEntity<UserResponse> {
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
			.body(PasswordUpdateResponse(success = false, message = "Не найден пользователь с предоставленной почтой прав"))
		
		if (editUser.id == null)
			throw NullPointerException("Ошибка получения id пользователя")
		
		val validationResult = userService.validatePasswordChange(currUser, editUser.id!!.toLong(), request)
		
		return if (validationResult.valid){
			userService.updatePassword(editUser, request)
			ResponseEntity.ok((PasswordUpdateResponse(success = true, message = "Пароль успешно изменен")))
		}
		else
			ResponseEntity.ok((PasswordUpdateResponse(success = false, message = validationResult.message)))
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
		
		val isAdmin = administratorRepository.existsByUserId(userId.toLong())
		
		return CurrentUser(
			id = userId,
			email = email,
			isAdmin = isAdmin,
			userDetails = user
		)
	}
}