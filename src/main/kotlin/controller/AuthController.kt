package org.zak.controller

import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.zak.dto.LoginRequest
import org.zak.service.UserService
import org.zak.util.JwtUtil
import org.springframework.http.HttpStatus
import org.springframework.security.core.userdetails.UserDetails
import org.zak.dto.UserResponse

@RestController
@RequestMapping("/api/auth")
class AuthController(
	private val userService: UserService,
	private val jwtUtil: JwtUtil
) {
	private val logger = LoggerFactory.getLogger(AuthController::class.java)
	
	@PostMapping("/login")
	fun login(@RequestBody request: LoginRequest): ResponseEntity<Any> {
		logger.info("Login attempt for email: ${request.email}")
		
		try {
			val user = userService.authenticate(request)
			
			if (user == null) {
				logger.warn("Authentication failed for email: ${request.email}")
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(mapOf("error" to "Invalid credentials", "message" to "Пользователь не найден или неверный пароль"))
			}
			
			if (user.id == null) {
				logger.error("User ID is null for email: ${request.email}")
				return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body(mapOf("error" to "User ID cannot be null"))
			}
			
			val userDetails = userService.loadUserByUsername(user.email)
			// ✅ Используем токен с userId в claims
			val token = jwtUtil.generateToken(userDetails, mapOf("userId" to user.id!!))
			// ✅ Теперь этот метод существует с двумя параметрами
			val refreshToken = jwtUtil.generateRefreshToken(userDetails, user.id!!.toInt())
			
			logger.info("Login successful for email: ${request.email}, userId: ${user.id}")
			
			return ResponseEntity.ok(
				AuthResponse(
					token = token,
					refreshToken = refreshToken,
					user = userService.toUserResponse(user)
				)
			)
			
		} catch (e: Exception) {
			logger.error("Login error for email: ${request.email}", e)
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(mapOf("error" to (e.message ?: "Unknown error")))
		}
	}
	
	@GetMapping("/verify")
	fun verifyToken(@RequestHeader("Authorization") authHeader: String): ResponseEntity<VerifyResponse> {
		return try {
			val token = authHeader.removePrefix("Bearer ")
			
			if (!jwtUtil.validateToken(token)) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(VerifyResponse(null, false))
			}
			
			val username = jwtUtil.extractUsername(token)
			val user = userService.getUserByEmail(username)
			
			if (user == null) {
				ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(VerifyResponse(null, false))
			} else {
				ResponseEntity.ok(VerifyResponse(user, true))
			}
		} catch (e: Exception) {
			logger.error("Token verification error", e)
			ResponseEntity.status(HttpStatus.UNAUTHORIZED)
				.body(VerifyResponse(null, false))
		}
	}
	
	@PostMapping("/refresh")
	fun refresh(@RequestBody request: RefreshRequest): ResponseEntity<Any> {
		return try {
			val refreshToken = request.refreshToken
			
			if (!jwtUtil.validateToken(refreshToken)) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(mapOf("error" to "Invalid refresh token"))
			}
			
			val username = jwtUtil.extractUsername(refreshToken)
			val userId = jwtUtil.extractUserId(refreshToken) ?: throw Exception("No userId in token")
			val userDetails = userService.loadUserByUsername(username)
			// ✅ Генерируем новый access token с userId
			val newToken = jwtUtil.generateToken(userDetails, mapOf("userId" to userId))
			// ✅ Генерируем новый refresh token с userId
			val newRefreshToken = jwtUtil.generateRefreshToken(userDetails, userId)
			val user = userService.getUserByEmail(username)
			
			ResponseEntity.ok(
				AuthResponse(
					token = newToken,
					refreshToken = newRefreshToken,
					user = user
				)
			)
		} catch (e: Exception) {
			logger.error("Refresh token error", e)
			ResponseEntity.status(HttpStatus.UNAUTHORIZED)
				.body(mapOf("error" to "Token refresh failed"))
		}
	}
	
	@PostMapping("/logout")
	fun logout(): ResponseEntity<Map<String, String>> {
		return ResponseEntity.ok(mapOf("message" to "Logged out successfully"))
	}
	
	@GetMapping("/check-auth")
	@ResponseBody
	fun checkAuth(
		@RequestHeader(value = "Authorization", required = false) authHeader: String?
	): ResponseEntity<AuthCheckResponse> {
		val isValid = authHeader?.startsWith("Bearer ") == true && try {
			val token = authHeader.removePrefix("Bearer ")
			val username = jwtUtil.extractUsername(token)
			val userDetails = userService.loadUserByUsername(username)
			jwtUtil.validateToken(token, userDetails)
		} catch (e: Exception) {
			false
		}
		
		return if (isValid) {
			ResponseEntity.ok(AuthCheckResponse(authenticated = true))
		} else {
			ResponseEntity.status(HttpStatus.UNAUTHORIZED)
				.body(AuthCheckResponse(authenticated = false, redirectTo = "/login"))
		}
	}
}

data class AuthCheckResponse(
	val authenticated: Boolean,
	val redirectTo: String? = null
)

data class AuthResponse(
	val token: String,
	val refreshToken: String,
	val user: UserResponse?
)

data class RefreshRequest(
	val refreshToken: String
)

data class VerifyResponse(
	val user: UserResponse?,
	val valid: Boolean
)











