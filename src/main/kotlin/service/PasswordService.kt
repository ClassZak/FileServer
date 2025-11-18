package org.zak.service

import org.springframework.stereotype.Service

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder

@Service
class PasswordService(
	private val passwordEncoder: PasswordEncoder
) {
	
	fun hashPassword(password: String): String {
		return passwordEncoder.encode(password)
	}
	
	fun verifyPassword(password: String, hashedPassword: String): Boolean {
		return passwordEncoder.matches(password, hashedPassword)
	}
}