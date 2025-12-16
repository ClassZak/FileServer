package org.zak.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import org.zak.entity.OperationType

@Repository
interface OperationTypeRepository : JpaRepository<OperationType, Int> {
	fun findByName(name: String): OperationType?
	
	@Query("SELECT ot FROM OperationType ot WHERE ot.name IN :names")
	fun findByNames(@Param("names") names: List<String>): List<OperationType>
}