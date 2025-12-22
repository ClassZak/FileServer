package org.zak.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import org.zak.entity.FileMetadata
import org.zak.entity.Group
import org.zak.entity.User

@Repository
interface FileMetadataRepository : JpaRepository<FileMetadata, Long> {
	fun findByPath(path: String): FileMetadata?
	
	@Query("SELECT f FROM FileMetadata f WHERE f.path LIKE CONCAT(:prefix, '%')")
	fun findByPathStartingWith(@Param("prefix") prefix: String): List<FileMetadata>
	
	fun findByUserId(userId: Int): List<FileMetadata>
	fun findByGroupId(groupId: Int): List<FileMetadata>
	
	@Query("""
        SELECT f FROM FileMetadata f
        WHERE (f.user.id = :userId OR f.group.id IN :userGroupIds)
        AND f.path LIKE CONCAT(:pathFilter, '%')
    """)
	fun findAccessibleFiles(
		@Param("userId") userId: Int,
		@Param("userGroupIds") userGroupIds: List<Int>,
		@Param("pathFilter") pathFilter: String
	): List<FileMetadata>
	
	fun findByPathAndGroup(path: String, group: Group): FileMetadata?
	
	fun findByPathAndUser(path: String, user: User): FileMetadata?
	
	
	fun existsByPathAndUserId(path: String, userId: Int): Boolean
	fun existsByPathAndGroupId(path: String, groupId: Int): Boolean
}