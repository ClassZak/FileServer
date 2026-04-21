package org.zak.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import org.zak.entity.DeletedFile
import org.zak.entity.FileEntity
import java.time.LocalDateTime

@Repository
interface DeletedFileRepository : JpaRepository<DeletedFile, Long> {
	@Query("SELECT df FROM DeletedFile df WHERE df.deletedAt < :threshold")
	fun findOlderThan(@Param("threshold") threshold: LocalDateTime): List<DeletedFile>
	
	@Query("SELECT df FROM DeletedFile df ORDER BY df.deletedAt DESC")
	fun findAllOrderByDeletedAtDesc(): List<DeletedFile>
	
	@Query("SELECT df FROM DeletedFile df WHERE df.fileEntity = :fileEntity ORDER BY df.version DESC")
	fun findByFileEntityOrderByVersionDesc(@Param("fileEntity") fileEntity: FileEntity): List<DeletedFile>
	
	fun findByOriginalPath(originalPath: String): List<DeletedFile>
}