package org.zak.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import org.zak.entity.DeletedFile
import org.zak.entity.FileEntity
import java.time.LocalDateTime

@Repository
interface DeletedFileRepository : JpaRepository<DeletedFile, Long> {
	
	@Query("""
		SELECT df
		FROM DeletedFile df
		ORDER BY df.deletedAt DESC
	""")
	fun findAllOrderByDeletedAtDesc(): List<DeletedFile>
	
	@Query("""
		SELECT df
		FROM DeletedFile df
		WHERE df.fileEntity = :fileEntity
		ORDER BY df.version DESC
	""")
	fun findByFileEntityOrderByVersionDesc(@Param("fileEntity") fileEntity: FileEntity): List<DeletedFile>
	
	fun findByFileEntityAndVersion(fileEntity: FileEntity, version: Int): DeletedFile?
	
	fun findByOriginalPath(originalPath: String): List<DeletedFile>
	
	
	@Modifying
	@Transactional
	@Query("""
		UPDATE DeletedFile df
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