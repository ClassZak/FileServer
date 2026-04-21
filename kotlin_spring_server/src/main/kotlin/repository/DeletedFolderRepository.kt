package org.zak.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import org.zak.entity.DeletedFolder
import org.zak.entity.FolderEntity
import java.time.LocalDateTime

@Repository
interface DeletedFolderRepository : JpaRepository<DeletedFolder, Long> {
	@Query("SELECT df FROM DeletedFolder df WHERE df.deletedAt < :threshold")
	fun findOlderThan(@Param("threshold") threshold: LocalDateTime): List<DeletedFolder>
	
	@Query("SELECT df FROM DeletedFolder df ORDER BY df.deletedAt DESC")
	fun findAllOrderByDeletedAtDesc(): List<DeletedFolder>
	
	@Query("SELECT df FROM DeletedFolder df WHERE df.folderEntity = :folderEntity ORDER BY df.version DESC")
	fun findByFolderEntityOrderByVersionDesc(@Param("folderEntity") folderEntity: FolderEntity): List<DeletedFolder>
	
	fun findByOriginalPath(originalPath: String): List<DeletedFolder>
}