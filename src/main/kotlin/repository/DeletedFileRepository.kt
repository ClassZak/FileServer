package org.zak.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import org.zak.entity.DeletedFile
import java.time.LocalDateTime

@Repository
interface DeletedFileRepository : JpaRepository<DeletedFile, Long> {
	@Query("SELECT df FROM DeletedFile df WHERE df.workTime < :threshold")
	fun findOlderThan(@Param("threshold") threshold: LocalDateTime): List<DeletedFile>
	
	@Query("SELECT df FROM DeletedFile df ORDER BY df.workTime DESC")
	fun findAllOrderByWorkTimeDesc(): List<DeletedFile>
}