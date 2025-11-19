package org.zak.controller


import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.zak.dto.CreateUserRequest
import org.zak.dto.LoginRequest
import org.zak.dto.UserResponse
import org.zak.service.UserService

@RestController
@RequestMapping("/api/users")
class UserController(
	private val userService: UserService
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
	
	@GetMapping("/{email}")
	fun getUserByEmail(@PathVariable email: String): ResponseEntity<UserResponse> {
		return userService.getUserByEmail(email)?.let {
			ResponseEntity.ok(it)
		} ?: ResponseEntity.notFound().build()
	}
}