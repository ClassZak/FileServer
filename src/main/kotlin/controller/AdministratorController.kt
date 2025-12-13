package org.zak.controller

import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.zak.dto.PasswordUpdateResponse
import org.zak.dto.UpdatePasswordRequest
import org.zak.org.zak.service.AdministratorService
import org.zak.repository.AdministratorRepository
import org.zak.service.UserService
import org.zak.util.JwtUtil

@RestController
@RequestMapping("/api/admin")
class AdministratorController(
	private val userService: UserService,
	private val administratorService: AdministratorService,
	private val jwtUtil: JwtUtil,
) {
	private val logger = LoggerFactory.getLogger(AuthController::class.java)
	
	@GetMapping("/is-admin")
	@PreAuthorize("isAuthenticated()")
	fun isAdmin(
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Map<String, Any>?> {
		val jwtToken = jwtUtil.extractJwtToken(authHeader)
		if (!jwtUtil.validateToken(jwtToken))
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(mapOf("isAdmin" to false))
		
		val userId = jwtUtil.extractUserId(jwtToken)
		if (userId == null){
			logger.error("User ID не найден в токене")
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(mapOf("error" to "Internal server error"))
		}
		
		val isAdmin = administratorService.isAdmin(userId.toLong())
		val body = mapOf("isAdmin" to isAdmin)
		
		return if (isAdmin)
			ResponseEntity.ok(body)
		else
			ResponseEntity.status(HttpStatus.NOT_FOUND).body(body)
	}
	
}
