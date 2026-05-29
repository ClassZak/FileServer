package org.zak.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import org.zak.entity.DeletedFolder
import org.zak.entity.FolderEntity
import java.time.LocalDateTime

@Repository
interface DeletedFolderRepository : JpaRepository<DeletedFolder, Long> {
	@Query("""
		SELECT df FROM DeletedFolder df WHERE df.deletedAt < :threshold
	""")
	fun findOlderThan(@Param("threshold") threshold: LocalDateTime): List<DeletedFolder>
	
	@Query("""
		SELECT df FROM DeletedFolder df ORDER BY df.deletedAt DESC
	""")
	fun findAllOrderByDeletedAtDesc(): List<DeletedFolder>
	
	@Query("""
		SELECT df FROM DeletedFolder df WHERE df.folderEntity = :folderEntity ORDER BY df.version DESC
	""")
	fun findByFolderEntityOrderByVersionDesc(@Param("folderEntity") folderEntity: FolderEntity): List<DeletedFolder>
	
	fun findByOriginalPath(originalPath: String): List<DeletedFolder>
	
	fun findByFolderEntityAndVersion(folderEntity: org.zak.entity.FolderEntity, version: Int): DeletedFolder?
	
	
	@Modifying
	@Transactional
	@Query("""
		UPDATE DeletedFolder df
		SET df.originalPath =
			CASE
				WHEN df.originalPath = CONCAT('groups/', :oldGroupName) THEN CONCAT('groups/', :newGroupName)
				ELSE REPLACE(df.originalPath, CONCAT('groups/', :oldGroupName, '/'), CONCAT('groups/', :newGroupName, '/'))
			END
		WHERE df.originalPath LIKE CONCAT('groups/', REPLACE(REPLACE(:oldGroupName, '%', '\%'), '_', '\_'), '/%') ESCAPE '\'
		   OR df.originalPath = CONCAT('groups/', :oldGroupName)
	""")
	fun updateGroupPaths(
		@Param("oldGroupName") oldGroupName: String,
		@Param("newGroupName") newGroupName: String
	): Int
}