package org.zak.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import org.zak.entity.FolderPermission
import org.zak.entity.FolderEntity
import org.zak.entity.Group
import org.zak.entity.User

@Repository
interface FolderPermissionRepository : JpaRepository<FolderPermission, Long> {
	fun findByFolderEntityAndUser(folderEntity: FolderEntity, user: User): FolderPermission?
	fun findByFolderEntityAndGroup(folderEntity: FolderEntity, group: Group): FolderPermission?
	
	@Query("""
        SELECT fp FROM FolderPermission fp
        JOIN fp.folderEntity fe
        WHERE fe.path = :path AND fp.user = :user
    """)
	fun findByPathAndUser(@Param("path") path: String, @Param("user") user: User): FolderPermission?
	
	@Query("""
        SELECT fp FROM FolderPermission fp
        JOIN fp.folderEntity fe
        WHERE fe.path = :path AND fp.group = :group
    """)
	fun findByPathAndGroup(@Param("path") path: String, @Param("group") group: Group): FolderPermission?
	
	@Query("SELECT fp FROM FolderPermission fp WHERE fp.folderEntity = :folderEntity")
	fun findByFolderEntity(@Param("folderEntity") folderEntity: FolderEntity): List<FolderPermission>
}