package org.zak.service

import jakarta.persistence.EntityNotFoundException
import org.slf4j.LoggerFactory
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.zak.dto.CreateUserRequest
import org.zak.dto.CurrentUser
import org.zak.dto.LoginBySNPRequest
import org.zak.dto.LoginRequest
import org.zak.dto.UpdatePasswordRequest
import org.zak.dto.UpdateUserRequest
import org.zak.dto.UserModelAdminResponse
import org.zak.dto.UserModelResponse
import org.zak.dto.UserResponse
import org.zak.dto.ValidationResult
import org.zak.entity.User
import org.zak.repository.UserRepository
import java.time.format.DateTimeFormatter

@Service
class UserService(
	private val userRepository: UserRepository,
	private val administratorService: AdministratorService,
	private val passwordEncoder: PasswordEncoder
) : UserDetailsService {
	private val logger = LoggerFactory.getLogger(UserService::class.java)
	
	override fun loadUserByUsername(email: String): UserDetails {
		val user = userRepository.findByEmail(email)
			?: throw UsernameNotFoundException("Пользователь с email $email не найден")
		
		return org.springframework.security.core.userdetails.User(
			user.email,
			user.passwordHash,
			listOf(SimpleGrantedAuthority("ROLE_USER"))
		)
	}
	
	
	fun authenticateBySNP(request: LoginBySNPRequest): User? {
		val user = userRepository.findBySurnameAndNameAndPatronymic(
			request.surname,
			request.name,
			request.patronymic
		)
		
		return user?.takeIf {
			passwordEncoder.matches(request.password, it.passwordHash)
		}
	}
	
	fun findBySNP(surname: String, name: String, patronymic: String): User? {
		return userRepository.findBySurnameAndNameAndPatronymic(
			surname, name, patronymic
		)
	}
	
	fun authenticate(request: LoginRequest): User? {
		val user = userRepository.findByEmail(request.email)
		return if (user != null && passwordEncoder.matches(request.password, user.passwordHash)) {
			user
		} else {
			null
		}
	}
	
	fun hasPasswordUpdateAccess(currentUser: CurrentUser, email: String): Boolean{
		if(currentUser.id == null)
			throw NullPointerException("Необходим id у currentUser")
		
		return if(currentUser.email == email)
			true
		else
			administratorService.isAdmin(currentUser.id)
	}
	
	fun validatePasswordChange(
		currentUser: CurrentUser,
		targetUserId: Int,
		request: UpdatePasswordRequest
	): ValidationResult {
		if(currentUser.id == null)
			throw NullPointerException("Необходим id у currentUser")
		
		// Если пользователь меняет свой пароль - проверяем старый пароль
		if (currentUser.id == targetUserId) {
			val user: User? = userRepository.findById(targetUserId).orElse(null)
			if (user == null)
				return ValidationResult(
					valid = false,
					message = "Пользователь не найден"
				)
			
			val passwordMatches = passwordEncoder.matches(
				request.oldPassword,
				user.passwordHash
			)
			
			if (!passwordMatches) {
				return ValidationResult(
					valid = false,
					message = "Неверный текущий пароль"
				)
			}
			
			return ValidationResult(valid = true, message = "OK")
		}
		
		// Если админ меняет чужой пароль - не проверяем старый пароль
		if (!administratorService.exists(currentUser.id)){
			// Проверка, что новый пароль не совпадает со старым
			if (request.oldPassword == request.newPassword) {
				return ValidationResult(
					valid = false,
					message = "Новый пароль должен отличаться от старого"
				)
			}
		}
		
		// Проверка сложности нового пароля
		if (!isPasswordStrong(request.newPassword)) {
			return ValidationResult(
				valid = false,
				message = "Пароль должен содержать минимум 6 символов, включая буквы и цифры"
			)
		}
		
		return ValidationResult(valid = true, message = "OK")
	}
	
	fun createUser(request: CreateUserRequest): User{
		if (userRepository.existsByEmail(request.email))
			throw IllegalArgumentException("Пользователь с email ${request.email} уже существует")
		
		val passwordHash = passwordEncoder.encode(request.password)
		var user = User(
			surname = request.surname,
			name = request.name,
			patronymic = request.patronymic,
			email = request.email,
			passwordHash = passwordHash
		)
		
		user = userRepository.save(user)
		
		return user
	}
	
	// Метод для обновления профиля
	
	fun updateUser(userId: Int, request: UpdateUserRequest): User {
		val user = userRepository.findById(userId)
			.orElseThrow { EntityNotFoundException("Пользователь не найден") }
		
		// Проверка email на уникальность (если email меняется)
		if (user.email != request.email && userRepository.existsByEmail(request.email))
			throw IllegalArgumentException("Email уже используется другим пользователем")
		
		user.apply {
			surname = request.surname
			name = request.name
			patronymic = request.patronymic
			email = request.email
		}
		
		val savedUser = userRepository.save(user)
		return savedUser
	}
	
	fun deleteUser(user: User){
		userRepository.delete(user)
	}
	
	// Методы для изменения пароля
	fun updatePassword(currentUser: CurrentUser, userId: Int, request: UpdatePasswordRequest) {
		val editUser = userRepository.findById(userId)
			.orElseThrow { Exception("Пользователь не найден") }
		
		return updatePassword(currentUser, editUser, request)
	}
	fun updatePassword(currentUser: CurrentUser, editUser: User, request: UpdatePasswordRequest){
		// Проверка старого пароля
		if (!administratorService.isAdmin(currentUser.id!!)){
			if (!passwordEncoder.matches(request.oldPassword, editUser.passwordHash)) {
				throw IllegalArgumentException("Неверный текущий пароль")
			}
		}
		
		editUser.passwordHash = passwordEncoder.encode(request.newPassword)
		userRepository.save(editUser)
	}
	
	// Проверка сложности пароля
	private fun isPasswordStrong(password: String): Boolean {
		if (password.length < 6) return false
		
		// Минимум одна буква и одна цифра
		val hasLetter = password.any { it.isLetter() }
		val hasDigit = password.any { it.isDigit() }
		
		return hasLetter && hasDigit
	}
	
	fun getUserByEmail(email: String): UserResponse? {
		return userRepository.findByEmail(email)?.let { toUserResponse(it) }
	}
	fun getUserEntityByEmail(email: String): User?{
		return userRepository.findByEmail(email)
	}
	
	fun getUserById(id: Int): UserResponse? {
		return userRepository.findById(id).orElse(null)?.let { toUserResponse(it) }
	}
	
	fun getUserEntityById(id: Int) : User?{
		return userRepository.findById(id).orElse(null)
	}
	
	fun getAllUserEntities(): List<User>{
		return userRepository.findAll()
	}
	
	fun getAllUserForAdmin(): List<UserModelAdminResponse>{
		return toUserModelAdminResponseList(getAllUserEntities())
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
	
	fun toUserModelResponse(user: User): UserModelResponse {
		return UserModelResponse(
			name = user.name,
			surname = user.surname,
			patronymic = user.patronymic,
			email = user.email
		)
	}
	
	fun toUserModelAdminResponse(user: User): UserModelAdminResponse {
		return UserModelAdminResponse(
			name = user.name,
			surname = user.surname,
			patronymic = user.patronymic,
			email = user.email,
			createdAt = user.createdAt
		)
	}
	fun toUserModelAdminResponseList(users: List<User>): List<UserModelAdminResponse> {
		return users.map { user ->
			UserModelAdminResponse(
				name = user.name,
				surname = user.surname,
				patronymic = user.patronymic,
				email = user.email,
				createdAt = user.createdAt
			)
		}
	}
}
