package org.zak.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import org.zak.entity.FileEntity
import org.zak.entity.FolderEntity

@Repository
interface FolderEntityRepository : JpaRepository<FolderEntity, Long> {
	fun findByPath(path: String): FolderEntity?
	
	fun findAllByPath(path: String): List<FolderEntity>
	
	fun findByPathAndIsDeletedFalse(path: String): FolderEntity?
	
	fun findByPathAndIsDeletedTrue(path: String): FolderEntity?
	
	fun findAllByPathAndIsDeletedTrue(path: String): List<FolderEntity>
	
	@Query("SELECT f FROM FolderEntity f WHERE f.path LIKE CONCAT(:prefix, '%')")
	fun findByPathStartingWith(@Param("prefix") prefix: String): List<FolderEntity>
	
	@Query("SELECT f FROM FolderEntity f WHERE f.isDeleted = FALSE AND f.path LIKE CONCAT(:prefix, '%')")
	fun findByPathAndIsDeletedFalseStartingWith(@Param("prefix") prefix: String): List<FolderEntity>
	
	@Modifying
	@Transactional
	@Query("""
		UPDATE FolderEntity foe
		SET foe.path =
			CASE
				WHEN foe.path = CONCAT('groups/', :oldGroupName) THEN CONCAT('groups/', :newGroupName)
				ELSE REPLACE(foe.path, CONCAT('groups/', :oldGroupName, '/'), CONCAT('groups/', :newGroupName, '/'))
			END
		WHERE foe.path LIKE CONCAT('groups/', REPLACE(REPLACE(:oldGroupName, '%', '\%'), '_', '\_'), '/%') ESCAPE '\'
		   OR foe.path = CONCAT('groups/', :oldGroupName)
	""")
	fun updateGroupPaths(
		@Param("oldGroupName") oldGroupName: String,
		@Param("newGroupName") newGroupName: String
	): Int
}