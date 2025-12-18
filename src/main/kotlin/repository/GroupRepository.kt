package org.zak.repository

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.*
import org.zak.dto.GroupBasicInfoDto
import org.zak.dto.GroupDetailsDto
import org.zak.dto.UserModelResponse
import org.zak.entity.Group
import org.zak.entity.User

@Repository
interface GroupRepository : JpaRepository<Group, Int> {
	// Базовые методы
	fun findByName(name: String): Group?
	fun findByCreatorId(creatorId: Int): List<Group>
	
	@Query("SELECT g FROM Group g JOIN g.members m WHERE m.id = :userId")
	fun findByMemberId(@Param("userId") userId: Int): List<Group>
	
	@Query("SELECT u FROM User u JOIN u.groups g WHERE g.id = :groupId")
	fun findUsersInGroup(@Param("groupId") groupId: Int): List<User>
	
	/**
	 * Поиск групп по части имени (без учета регистра)
	 */
	@Query("SELECT g FROM Group g WHERE LOWER(g.name) LIKE LOWER(CONCAT('%', :pattern, '%'))")
	fun findByNameContainingIgnoreCase(@Param("pattern") pattern: String): List<Group>
	
	/**
	 * Проверка, является ли пользователь администратором
	 */
	@Query("SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM Administrator a WHERE a.user.id = :userId")
	fun isUserAdmin(@Param("userId") userId: Int): Boolean
	
	/**
	 * Проверка, состоит ли пользователь в группе (по имени группы)
	 */
	@Query("SELECT COUNT(m) > 0 FROM Group g JOIN g.members m WHERE g.name = :groupName AND m.id = :userId")
	fun isUserMemberOfGroupByName(
		@Param("userId") userId: Int,
		@Param("groupName") groupName: String
	): Boolean
	
	/**
	 * Проверка, состоит ли пользователь в группе (по ID группы)
	 */
	@Query("SELECT COUNT(m) > 0 FROM Group g JOIN g.members m WHERE g.id = :groupId AND m.id = :userId")
	fun isUserMemberOfGroup(
		@Param("userId") userId: Int,
		@Param("groupId") groupId: Int
	): Boolean
	
	/**
	 * Получение группы с участниками (для детального просмотра)
	 */
	@Query("SELECT DISTINCT g FROM Group g LEFT JOIN FETCH g.members LEFT JOIN FETCH g.creator WHERE g.name = :name")
	fun findByNameWithMembersAndCreator(@Param("name") name: String): Group?
	
	/**
	 * Проверка существования группы по имени
	 */
	fun existsByName(name: String): Boolean
	
	/**
	 * Получение участников группы в виде UserModelResponse
	 */
	@Query("""
        SELECT new org.zak.dto.UserModelResponse(
            u.surname,
            u.name,
            u.patronymic,
            u.email
        )
        FROM Group g JOIN g.members u
        WHERE g.name = :groupName
        ORDER BY u.surname, u.name
    """)
	fun findGroupMembersAsDto(@Param("groupName") groupName: String): List<UserModelResponse>
	
	/**
	 * Получение списка групп пользователя в DTO формате
	 */
	@Query("""
        SELECT new org.zak.dto.GroupBasicInfoDto(
            g.name,
            SIZE(g.members),
            g.creator.email
        )
        FROM Group g JOIN g.members m
        WHERE m.id = :userId
        ORDER BY g.name
    """)
	fun findUserGroupsAsDto(@Param("userId") userId: Int): List<GroupBasicInfoDto>
	
	/**
	 * Получение всех групп в DTO формате (для администраторов)
	 */
	@Query("""
        SELECT new org.zak.dto.GroupBasicInfoDto(
            g.name,
            SIZE(g.members),
            g.creator.email
        )
        FROM Group g
        ORDER BY g.name
    """)
	fun findAllGroupsAsDto(): List<GroupBasicInfoDto>
}