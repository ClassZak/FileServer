package org.zak.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import org.zak.entity.Administrator
import org.zak.entity.User


@Repository
interface AdministratorRepository : JpaRepository<Administrator, Int> {
	@Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM Administrator a WHERE a.user.id = :userId")
	fun existsByUserId(@Param("userId") userId: Int): Boolean
	
	@Query("SELECT a FROM Administrator a WHERE a.user.id = :userId")
	fun findByUserId(@Param("userId") userId: Int): Administrator?
	
	@Query("SELECT a FROM Administrator a WHERE a.user.email = :email")
	fun findByUserEmail(@Param("email") email: String): Administrator?
}