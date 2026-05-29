package org.zak.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import org.zak.entity.User
import org.zak.entity.WorkHistory
import java.time.LocalDateTime

@Repository
interface WorkHistoryRepository : JpaRepository<WorkHistory, Long> {
	fun findByUserId(userId: Int): List<WorkHistory>
	fun findByOperationTypeId(operationTypeId: Int): List<WorkHistory>
	
	@Query("""
        SELECT wh
		FROM WorkHistory wh
        WHERE wh.workTime BETWEEN :start AND :end
        ORDER BY wh.workTime DESC
    """)
	fun findByPeriod(
		@Param("start") start: LocalDateTime,
		@Param("end") end: LocalDateTime
	): List<WorkHistory>
	
	@Query("""
		SELECT COUNT(wh)
		FROM WorkHistory wh
		WHERE wh.user.id = :userId AND wh.operationType.id = :operationTypeId
	""")
	fun countByUserAndOperationType(
		@Param("userId") userId: Int,
		@Param("operationTypeId") operationTypeId: Int
	): Long
	
	
	@Modifying
	@Transactional
	@Query("""
		UPDATE WorkHistory wh
		SET wh.path =
			CASE
				WHEN wh.path = CONCAT('groups/', :oldGroupName) THEN CONCAT('groups/', :newGroupName)
				ELSE REPLACE(wh.path, CONCAT('groups/', :oldGroupName, '/'), CONCAT('groups/', :newGroupName, '/'))
			END
		WHERE wh.path LIKE CONCAT('groups/', REPLACE(REPLACE(:oldGroupName, '%', '\%'), '_', '\_'), '/%') ESCAPE '\'
		   OR wh.path = CONCAT('groups/', :oldGroupName)
	""")
	fun updateGroupPaths(
		@Param("oldGroupName") oldGroupName: String,
		@Param("newGroupName") newGroupName: String
	): Int
	
	@Modifying
	@Transactional
	@Query("""
		DELETE FROM WorkHistory wh
		WHERE wh.user = :user
	""")
	fun deleteUserHistory(
		@Param("user") user: User
	) : Int
}