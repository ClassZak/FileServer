package org.zak.dto

import org.zak.entity.User
import java.time.LocalDateTime

data class CreateUserRequest(
	val surname: String,
	val name: String,
	val patronymic: String,
	val email: String,
	val password: String
)

class UpdateUserRequest(
	val surname: String,
	val name: String,
	val patronymic: String,
	val email: String,
	val password: String
)

data class UserResponse(
	val id: Int?,
	val name: String,
	val surname: String,
	val patronymic: String,
	val email: String,
	val createdAt: String
)

data class LoginRequest(
	val email: String,
	val password: String
)

data class UpdatePasswordRequest(
	val oldPassword: String,
	val newPassword: String
)

data class CurrentUser(
	val id: Int?,
	val email: String,
	val isAdmin: Boolean,
	val userDetails: User?
)

data class PasswordUpdateResponse(
	val success: Boolean,
	val message: String
)

data class ValidationResult(
	val valid: Boolean,
	val message: String
)
