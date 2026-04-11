package org.zak.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import org.zak.entity.FileEntity

@Repository
interface FileEntityRepository : JpaRepository<FileEntity, Long> {
	fun findByPath(path: String): FileEntity?
	
	@Query("SELECT f FROM FileEntity f WHERE f.path LIKE CONCAT(:prefix, '%')")
	fun findByPathStartingWith(@Param("prefix") prefix: String): List<FileEntity>
}