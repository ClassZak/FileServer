package org.zak.service

import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.zak.dto.CreateUserRequest
import org.zak.dto.LoginRequest
import org.zak.dto.UserResponse
import org.zak.entity.User
import org.zak.repository.UserRepository
import java.time.format.DateTimeFormatter

@Service
class UserService(
	private val userRepository: UserRepository,
	private val passwordEncoder: PasswordEncoder
) : UserDetailsService {
	
	override fun loadUserByUsername(email: String): UserDetails {
		val user = userRepository.findByEmail(email)
			?: throw UsernameNotFoundException("Пользователь с email $email не найден")
		
		return org.springframework.security.core.userdetails.User(
			user.email,
			user.passwordHash,
			listOf(SimpleGrantedAuthority("ROLE_USER"))
		)
	}
	
	fun createUser(request: CreateUserRequest): UserResponse {
		if (userRepository.existsByEmail(request.email)) {
			throw IllegalArgumentException("Пользователь с email ${request.email} уже существует")
		}
		
		val hashedPassword = passwordEncoder.encode(request.password)
		
		val user = User(
			name = request.name,
			surname = request.surname,
			patronymic = request.patronymic,
			email = request.email,
			passwordHash = hashedPassword
		)
		
		val savedUser = userRepository.save(user)
		return toUserResponse(savedUser)
	}
	
	fun authenticate(request: LoginRequest): User? {
		val user = userRepository.findByEmail(request.email)
		return if (user != null && passwordEncoder.matches(request.password, user.passwordHash)) {
			user
		} else {
			null
		}
	}
	
	fun getUserByEmail(email: String): UserResponse? {
		return userRepository.findByEmail(email)?.let { toUserResponse(it) }
	}
	
	fun getUserById(id: Int): UserResponse? {
		return userRepository.findById(id.toLong()).orElse(null)?.let { toUserResponse(it) }
	}
	
	fun toUserResponse(user: User): UserResponse {
		return UserResponse(
			id = user.id,
			name = user.name,
			surname = user.surname,
			patronymic = user.patronymic,
			email = user.email,
			createdAt = user.createdAt.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
		)
	}
}