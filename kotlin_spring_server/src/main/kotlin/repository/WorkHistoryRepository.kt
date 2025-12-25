package org.zak.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import org.zak.entity.WorkHistory
import java.time.LocalDateTime

@Repository
interface WorkHistoryRepository : JpaRepository<WorkHistory, Long> {
	fun findByUserId(userId: Int): List<WorkHistory>
	fun findByOperationTypeId(operationTypeId: Int): List<WorkHistory>
	
	@Query("""
        SELECT wh FROM WorkHistory wh
        WHERE wh.workTime BETWEEN :start AND :end
        ORDER BY wh.workTime DESC
    """)
	fun findByPeriod(
		@Param("start") start: LocalDateTime,
		@Param("end") end: LocalDateTime
	): List<WorkHistory>
	
	@Query("SELECT COUNT(wh) FROM WorkHistory wh WHERE wh.user.id = :userId AND wh.operationType.id = :operationTypeId")
	fun countByUserAndOperationType(
		@Param("userId") userId: Int,
		@Param("operationTypeId") operationTypeId: Int
	): Long
}