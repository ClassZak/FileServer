package org.zak.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.*
import org.zak.entity.Group

@Repository
interface GroupRepository : JpaRepository<Group, Int> {
	fun findByName(name: String): Group?
	fun findByCreatorId(creatorId: Int): List<Group>
	
	@Query("SELECT g FROM Group g JOIN g.members m WHERE m.id = :userId")
	fun findByMemberId(@Param("userId") userId: Int): List<Group>
	
	@Query("SELECT COUNT(g) > 0 FROM Group g JOIN g.members m WHERE g.id = :groupId AND m.id = :userId")
	fun isUserMemberOfGroup(@Param("groupId") groupId: Int, @Param("userId") userId: Int): Boolean
}