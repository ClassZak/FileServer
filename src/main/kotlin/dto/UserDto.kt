package org.zak.dto

data class CreateUserRequest(
	val name: String,
	val surname: String,
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