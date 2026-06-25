package org.zak.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import org.zak.entity.FileEntity

@Repository
interface FileEntityRepository : JpaRepository<FileEntity, Long> {
	fun findByPath(path: String): FileEntity?
	
	fun findAllByPath(path: String): List<FileEntity>
	
	fun findByPathAndIsDeletedFalse(path: String): FileEntity?
	
	fun findByPathAndIsDeletedTrue(path: String): FileEntity?
	
	fun findAllByPathAndIsDeletedTrue(path: String): List<FileEntity>
	
	@Query("SELECT f FROM FileEntity f WHERE f.path LIKE CONCAT(:prefix, '%')")
	fun findByPathStartingWith(@Param("prefix") prefix: String): List<FileEntity>
	
	@Query("SELECT f FROM FileEntity f WHERE f.isDeleted = FALSE AND f.path LIKE CONCAT(:prefix, '%')")
	fun findByPathAndIsDeletedFalseStartingWith(@Param("prefix") prefix: String): List<FileEntity>
	
	@Modifying
	@Transactional
	@Query("""
		UPDATE FileEntity fe
		SET fe.path =
			CASE
				WHEN fe.path = CONCAT('groups/', :oldGroupName) THEN CONCAT('groups/', :newGroupName)
				ELSE REPLACE(fe.path, CONCAT('groups/', :oldGroupName, '/'), CONCAT('groups/', :newGroupName, '/'))
			END
		WHERE fe.path LIKE CONCAT('groups/', REPLACE(REPLACE(:oldGroupName, '%', '\%'), '_', '\_'), '/%') ESCAPE '\'
		   OR fe.path = CONCAT('groups/', :oldGroupName)
	""")
	fun updateGroupPaths(
		@Param("oldGroupName") oldGroupName: String,
		@Param("newGroupName") newGroupName: String
	): Int
}