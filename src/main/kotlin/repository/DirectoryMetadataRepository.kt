package org.zak.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import org.zak.entity.DirectoryMetadata

@Repository
interface DirectoryMetadataRepository : JpaRepository<DirectoryMetadata, Long> {
	fun findByPath(path: String): DirectoryMetadata?
	
	@Query("SELECT d FROM DirectoryMetadata d WHERE d.path LIKE CONCAT(:prefix, '%')")
	fun findByPathStartingWith(@Param("prefix") prefix: String): List<DirectoryMetadata>
	
	fun findByUserId(userId: Int): List<DirectoryMetadata>
	fun findByGroupId(groupId: Int): List<DirectoryMetadata>
}