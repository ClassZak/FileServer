package org.zak.controller

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
import org.zak.repository.AdministratorRepository
import org.zak.service.UserService
import org.zak.util.JwtUtil

@RestController
@RequestMapping("/api/admin")
class AdministratorController(
	private val userService: UserService,
	private val administratorRepository: AdministratorRepository,
	private val jwtUtil: JwtUtil
) {
	
	@GetMapping("/is-admin")
	@PreAuthorize("isAuthenticated()")
	fun isAdmin(
		@RequestHeader("Authorization") authHeader: String
	): ResponseEntity<Map<String, Boolean>>{
		val jwtToken = jwtUtil.extractJwtToken(authHeader)
		if (!jwtUtil.validateToken(jwtToken))
			ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(mapOf("isAdmin" to false))
		
		val userId = jwtUtil.extractUserId(jwtToken)
			?: throw Exception("User ID не найден в токене")
		
		return if (administratorRepository.existsByUserId(userId.toLong()))
			ResponseEntity.ok(mapOf("isAdmin" to true))
		else
			ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("isAdmin" to false))
	}
	
}