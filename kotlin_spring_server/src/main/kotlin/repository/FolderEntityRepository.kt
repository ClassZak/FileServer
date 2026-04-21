package org.zak.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import org.zak.entity.FileEntity
import org.zak.entity.FolderEntity

@Repository
interface FolderEntityRepository : JpaRepository<FolderEntity, Long> {
	fun findByPath(path: String): FolderEntity?
	
	@Query("SELECT f FROM FolderEntity f WHERE f.path LIKE CONCAT(:prefix, '%')")
	fun findByPathStartingWith(@Param("prefix") prefix: String): List<FolderEntity>
}