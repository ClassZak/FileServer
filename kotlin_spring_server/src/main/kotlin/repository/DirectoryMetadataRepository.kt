package org.zak.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import org.zak.entity.DirectoryMetadata
import org.zak.entity.Group
import org.zak.entity.User

@Repository
interface DirectoryMetadataRepository : JpaRepository<DirectoryMetadata, Long> {
	
	// Для поиска конкретной директории пользователя по точному пути
	@Query("""
        SELECT d FROM DirectoryMetadata d
        WHERE d.path = :path
        AND (d.user.id = :userId OR d.group.id IN :userGroupIds)
    """)
	fun findByPathAndUserOrUserGroups(
		@Param("path") path: String,
		@Param("userId") userId: Int,
		@Param("userGroupIds") userGroupIds: Collection<Int>
	): List<DirectoryMetadata>
	
	// Для поиска всех директорий пользователя (по точному совпадению)
	fun findByUserId(userId: Int): List<DirectoryMetadata>
	
	// Упрощенная версия без CASE в ORDER BY
	@Query("""
        SELECT d FROM DirectoryMetadata d
        WHERE d.path = :path
        AND (d.user.id = :userId OR d.group.id IN :userGroupIds)
    """)
	fun findByExactPathForUser(
		@Param("path") path: String,
		@Param("userId") userId: Int,
		@Param("userGroupIds") userGroupIds: Collection<Int>
	): List<DirectoryMetadata>
	
	fun findAllByPath(path: String): List<DirectoryMetadata>
	
	fun findAllByGroupId(groupId: Int): List<DirectoryMetadata>
	
	fun findAllByPathAndGroup(path: String, group: Group): List<DirectoryMetadata>
	
	fun findAllByPathAndUser(path: String, user: User): List<DirectoryMetadata>
	
	
	fun findByPathAndGroup(path: String, group: Group): DirectoryMetadata?
	
	fun findByPathAndUser(path: String, user: User): DirectoryMetadata?
	
	@Query("SELECT d FROM DirectoryMetadata d WHERE d.path LIKE CONCAT(:prefix, '%')")
	fun findByPathStartingWith(@Param("prefix") prefix: String): List<DirectoryMetadata>
}