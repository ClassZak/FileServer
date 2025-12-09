package org.zak.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import org.zak.entity.Administrator
import org.zak.entity.User


@Repository
interface AdministratorRepository : JpaRepository<User, Long> {
	@Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM Administrator a WHERE a.user.id = :userId")
	fun existsByUserId(@Param("userId") userId: Long): Boolean
	
	@Query("SELECT a FROM Administrator a WHERE a.user.id = :userId")
	fun findByUserIdJpql(@Param("userId") userId: Long): Administrator?
	
	@Query("SELECT a FROM Administrator a WHERE a.user.email = :email")
	fun findByUserEmailJpql(@Param("email") email: String): Administrator?
}