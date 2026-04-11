package org.zak.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import org.zak.entity.FilePermission
import org.zak.entity.FileEntity
import org.zak.entity.Group
import org.zak.entity.User

@Repository
interface FilePermissionRepository : JpaRepository<FilePermission, Long> {
	fun findByFileEntityAndUser(fileEntity: FileEntity, user: User): FilePermission?
	fun findByFileEntityAndGroup(fileEntity: FileEntity, group: Group): FilePermission?
	
	@Query("""
        SELECT fp FROM FilePermission fp
        JOIN fp.fileEntity fe
        WHERE fe.path = :path AND fp.user = :user
    """)
	fun findByPathAndUser(@Param("path") path: String, @Param("user") user: User): FilePermission?
	
	@Query("""
        SELECT fp FROM FilePermission fp
        JOIN fp.fileEntity fe
        WHERE fe.path = :path AND fp.group = :group
    """)
	fun findByPathAndGroup(@Param("path") path: String, @Param("group") group: Group): FilePermission?
	
	@Query("SELECT fp FROM FilePermission fp WHERE fp.fileEntity = :fileEntity")
	fun findByFileEntity(@Param("fileEntity") fileEntity: FileEntity): List<FilePermission>
}