package org.zak.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import org.zak.entity.User

@Repository
interface UserRepository : JpaRepository<User, Int> {
	fun findBySurnameAndNameAndPatronymic(
		surname: String,
		name: String,
		patronymic: String
	): User?
	
	fun findByEmail(email: String): User?
	fun existsByEmail(email: String): Boolean
	
	@Query("SELECT u FROM User u WHERE u.id IN :userIds")
	fun findByIds(@Param("userIds") userIds: List<Int>): List<User>
	
	@Query("SELECT u FROM User u WHERE LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))")
	fun searchByEmail(@Param("search") search: String): List<User>
}