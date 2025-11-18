package org.zak.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import org.zak.entity.User

interface UserRepository : JpaRepository<User, Long> {
	fun findByEmail(email: String) : User?
	fun existsByEmail(email: String) : Boolean
}