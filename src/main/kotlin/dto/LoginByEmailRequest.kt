package org.zak.dto

data class LoginByEmailRequest(
	val email: String,
	val password: String
)