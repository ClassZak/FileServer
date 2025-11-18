package org.zak.service


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
) {
	
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
	
	fun authenticate(request: LoginRequest): Boolean {
		val user = userRepository.findByEmail(request.email)
		return user?.let {
			passwordEncoder.matches(request.password, user.passwordHash)
		} ?: false
	}
	
	fun getUserByEmail(email: String): UserResponse? {
		return userRepository.findByEmail(email)?.let { toUserResponse(it) }
	}
	
	private fun toUserResponse(user: User): UserResponse {
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
