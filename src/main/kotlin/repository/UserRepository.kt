package org.zak.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import org.zak.entity.User

@Repository
interface UserRepository : JpaRepository<User, Long> {
	fun findBySurnameAndNameAndPatronymic(
		surname: String,
		name: String,
		patronymic: String
	): User?
	fun findByEmail(email: String) : User?
	fun existsByEmail(email: String) : Boolean
}