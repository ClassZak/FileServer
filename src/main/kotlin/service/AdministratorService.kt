package org.zak.service

import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.zak.repository.AdministratorRepository
import org.zak.repository.UserRepository
import org.zak.util.JwtUtil

@Service
class AdministratorService(
	private val userRepository: UserRepository,
	private val administratorRepository: AdministratorRepository,
	private val passwordEncoder: PasswordEncoder,
	private val jwtUtil: JwtUtil
) {
	
	fun isAdmin(userId: Long): Boolean {
		return administratorRepository.existsByUserId(userId)
	}
	
	fun exists(targetUserId: Long): Boolean {
		return administratorRepository.existsByUserId(targetUserId)
	}
	
}

