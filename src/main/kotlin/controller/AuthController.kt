package org.zak.controller

import org.springframework.http.ResponseEntity
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.web.bind.annotation.*
import org.zak.dto.CreateUserRequest
import org.zak.dto.LoginRequest
import org.zak.service.UserService
import org.zak.util.JwtUtil
import jakarta.servlet.http.Cookie
import jakarta.servlet.http.HttpServletResponse

@Controller
class AuthController(
	private val authenticationManager: AuthenticationManager,
	private val userService: UserService,
	private val jwtUtil: JwtUtil
) {
	
	@GetMapping("/login")
	fun loginPage(@RequestParam(value = "error", defaultValue = "false") error: Boolean, model: Model): String {
		if (error) {
			model.addAttribute("error", "Неверный email или пароль")
		}
		return "login"
	}
	
	@GetMapping("/register")
	fun registerPage(): String {
		return "register"
	}
	
	@PostMapping("/api/auth/login")
	@ResponseBody
	fun login(
		@RequestBody request: LoginRequest,
		response: HttpServletResponse
	): ResponseEntity<Map<String, Any>> {
		val user = userService.authenticate(request)
		if (user != null) {
			val userDetails = userService.loadUserByUsername(user.email)
			val token = jwtUtil.generateToken(userDetails, user.id!!)
			
			// Устанавливаем токен в cookie
			val cookie = Cookie("jwtToken", token)
			cookie.path = "/"
			cookie.maxAge = 60 * 60 * 24 // 1 день
			response.addCookie(cookie)
			
			return ResponseEntity.ok(mapOf(
				"success" to true,
				"userId" to user.id,
				"email" to user.email,
				"name" to "${user.surname} ${user.name} ${user.patronymic}"
			)) as ResponseEntity<Map<String, Any>>
		} else {
			return ResponseEntity.status(401).body(mapOf("success" to false, "error" to "Неверные учетные данные"))
		}
	}
	
	@PostMapping("/api/auth/register")
	@ResponseBody
	fun register(@RequestBody request: CreateUserRequest): ResponseEntity<Map<String, Any>> {
		 try {
			val user = userService.createUser(request)
			return ResponseEntity.ok(mapOf("success" to true, "user" to user))
		} catch (e: IllegalArgumentException) {
			return ResponseEntity.badRequest().body(mapOf("success" to false, "error" to e.message)) as ResponseEntity<Map<String, Any>>
		}
	}
	
	@PostMapping("/api/auth/logout")
	@ResponseBody
	fun logout(response: HttpServletResponse): ResponseEntity<Map<String, String>> {
		// Удаляем токен из cookie
		val cookie = Cookie("jwtToken", "")
		cookie.path = "/"
		cookie.maxAge = 0
		response.addCookie(cookie)
		
		SecurityContextHolder.clearContext()
		return ResponseEntity.ok(mapOf("message" to "Успешный выход"))
	}
	
	@GetMapping("/api/auth/me")
	@ResponseBody
	fun getCurrentUser(): ResponseEntity<Map<String, Any?>> {
		val authentication = SecurityContextHolder.getContext().authentication
		return if (authentication.isAuthenticated && authentication.name != "anonymousUser") {
			val email = authentication.name
			val user = userService.getUserByEmail(email)
			ResponseEntity.ok(mapOf(
				"authenticated" to true,
				"user" to user
			))
		} else {
			ResponseEntity.ok(mapOf("authenticated" to false))
		}
	}
}