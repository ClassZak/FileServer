package org.zak.dto

data class LoginBySNPRequest(
	val surname: String,
	val name: String,
	val patronymic: String,
	val password: String
)