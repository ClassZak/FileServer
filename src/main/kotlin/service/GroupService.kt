package org.zak.service

import jakarta.persistence.EntityNotFoundException
import org.springframework.stereotype.Service
import org.zak.dto.GroupBasicInfoDto
import org.zak.dto.GroupDetailsDto
import org.zak.dto.GroupDetailsDtoAdmin
import org.zak.dto.UserModelAdminResponse
import org.zak.dto.UserModelResponse
import org.zak.entity.Group
import org.zak.entity.User
import org.zak.repository.GroupRepository
import org.zak.repository.UserRepository

/**
 * Сервис для управления группами пользователей.
 * Обрабатывает создание, чтение, обновление, удаление групп и управление участниками.
 *
 * Основные принципы:
 * - Создатель группы автоматически становится её участником
 * - Только админы могут выполнять административные операции
 * - Проверки целостности данных выполняются на уровне сервиса
 */
@Service
class GroupService(
	private val userRepository: UserRepository,
	private val administratorService: AdministratorService,
	private val groupRepository: GroupRepository
) {
	private val logger = org.slf4j.LoggerFactory.getLogger(GroupService::class.java)
	/**
	 * Проверка доступа пользователя к группе.
	 * Возвращает true если пользователь является участником или администратором
	 *
	 * Бизнес-логика вынесена из JPQL в сервис для лучшей читаемости и поддержки
	 */
	fun hasUserAccessToGroup(userId: Int, groupName: String): Boolean {
		// Проверяем, является ли пользователь администратором
		val isAdmin = administratorService.isAdmin(userId)
		
		// Если администратор - доступ есть
		if (isAdmin) {
			logger.debug("Пользователь ID=$userId является администратором - доступ к группе '$groupName' разрешен")
			return true
		}
		
		// Проверяем, состоит ли пользователь в группе
		val isMember = groupRepository.isUserMemberOfGroupByName(userId, groupName)
		
		if (isMember) {
			logger.debug("Пользователь ID=$userId является участником группы '$groupName'")
		} else {
			logger.debug("Пользователь ID=$userId не является участником группы '$groupName'")
		}
		
		return isMember
	}
	
	/**
	 * Получение полной информации о группе с участниками
	 * Если пользователь не имеет доступа, возвращает null
	 */
	fun getGroupFullDetails(groupName: String, userId: Int): GroupDetailsDto? {
		logger.debug("Получение полной информации о группе '$groupName' для пользователя ID=$userId")
		
		// Проверка доступа
		if (!hasUserAccessToGroup(userId, groupName)) {
			logger.warn("Пользователь ID=$userId пытается получить доступ к группе '$groupName' без прав")
			return null // Скрываем существование группы
		}
		
		// Получаем группу с участниками и создателем
		val group = groupRepository.findByNameWithMembersAndCreator(groupName) ?: return null
		
		// Преобразуем создателя в UserDto
		val creatorDto = UserModelResponse(
			surname = group.creator.surname,
			name = group.creator.name,
			patronymic = group.creator.patronymic,
			email = group.creator.email
		)
		
		// Преобразуем участников в UserDto
		val memberDtos = group.members.map { member ->
			UserModelResponse(
				surname = member.surname,
				name = member.name,
				patronymic = member.patronymic,
				email = member.email
			)
		}
		
		return GroupDetailsDto(
			name = group.name,
			membersCount = group.members.size,
			creator = creatorDto,
			members = memberDtos
		)
	}
	
	/**
	 * Получение полной информации о группе с участниками
	 * Если пользователь не имеет доступа, возвращает null
	 */
	fun getGroupFullDetailsAdmin(groupName: String, userId: Int): GroupDetailsDtoAdmin? {
		logger.debug("Получение полной информации о группе '$groupName' для пользователя ID=$userId")
		
		// Проверка доступа
		if (!hasUserAccessToGroup(userId, groupName)) {
			logger.warn("Пользователь ID=$userId пытается получить доступ к группе '$groupName' без прав")
			return null // Скрываем существование группы
		}
		
		// Получаем группу с участниками и создателем
		val group = groupRepository.findByNameWithMembersAndCreator(groupName) ?: return null
		
		// Преобразуем создателя в UserDto
		val creatorDto = UserModelAdminResponse(
			surname = group.creator.surname,
			name = group.creator.name,
			patronymic = group.creator.patronymic,
			email = group.creator.email,
			createdAt = group.creator.createdAt
		)
		
		// Преобразуем участников в UserDto
		val memberDtos = group.members.map { member ->
			UserModelAdminResponse(
				surname = member.surname,
				name = member.name,
				patronymic = member.patronymic,
				email = member.email,
				createdAt = member.createdAt
			)
		}
		
		return GroupDetailsDtoAdmin(
			name = group.name,
			membersCount = group.members.size,
			creator = creatorDto,
			members = memberDtos
		)
	}
	
	/**
	 * Получение списка групп текущего пользователя
	 */
	fun getUserGroups(userId: Int): List<GroupBasicInfoDto> {
		logger.debug("Получение списка групп пользователя ID=$userId")
		return groupRepository.findUserGroupsAsDto(userId)
	}
	
	/**
	 * Получение всех групп (только для администраторов)
	 */
	fun getAllGroupsForAdmin(): List<GroupBasicInfoDto> {
		logger.debug("Получение списка всех групп (администраторский доступ)")
		return groupRepository.findAllGroupsAsDto()
	}
	
	/**
	 * Получение участников группы
	 */
	fun getGroupMembers(groupName: String, userId: Int): List<UserModelResponse>? {
		logger.debug("Получение участников группы '$groupName' для пользователя ID=$userId")
		
		// Проверка доступа
		if (!hasUserAccessToGroup(userId, groupName)) {
			logger.warn("Пользователь ID=$userId пытается получить участников группы '$groupName' без прав")
			return null
		}
		
		return groupRepository.findGroupMembersAsDto(groupName)
	}
	
	/**
	 * Проверка доступа пользователя к группе
	 * Упрощенная версия для контроллера
	 */
	fun checkUserAccess(groupName: String, userId: Int): Boolean {
		return hasUserAccessToGroup(userId, groupName)
	}
	
	/**
	 * Проверка, состоит ли пользователь в группе (без учета админских прав)
	 */
	fun isUserMemberOfGroup(userId: Int, groupName: String): Boolean {
		return groupRepository.isUserMemberOfGroupByName(userId, groupName)
	}
	
	/**
	 * Поиск групп по шаблону имени
	 */
	fun searchGroupsByName(pattern: String): List<GroupBasicInfoDto> {
		logger.debug("Поиск групп по шаблону: $pattern")
		val groups = groupRepository.findByNameContainingIgnoreCase(pattern)
		return groups.map { group ->
			GroupBasicInfoDto(
				name = group.name,
				membersCount = group.members.size,
				creatorEmail = group.creator.email
			)
		}
	}
	
	/**
	 * Чтение группы (базовый метод)
	 */
	fun read(name: String): Group? = groupRepository.findByName(name)
	
	/**
	 * Создание группы
	 */
	fun create(name: String, creatorId: Int): Group {
		val user = userRepository.findById(creatorId).orElseThrow {
			EntityNotFoundException("Пользователь с ID $creatorId не найден")
		}
		return create(name, user)
	}
	
	fun create(name: String, creator: User?): Group {
		requireNotNull(creator) { "Не найден пользователь для создания группы" }
		
		logger.info("Создание группы '$name' пользователем ${creator.email}")
		
		// Проверка уникальности имени группы
		if (groupRepository.existsByName(name)) {
			throw IllegalArgumentException("Группа с именем '$name' уже существует")
		}
		
		val group = Group(name = name, creator = creator)
		group.members.add(creator) // Создатель автоматически становится участником
		
		return groupRepository.save(group)
	}
	
	/**
	 * Обновление группы по имени
	 */
	fun update(currentName: String, newName: String, creatorEmail: String) {
		logger.info("Обновление группы '$currentName' -> '$newName', новый создатель: $creatorEmail")
		
		val group = groupRepository.findByName(currentName) ?: throw
		EntityNotFoundException("Группа '$currentName' не найдена")
		
		val creator = userRepository.findByEmail(creatorEmail) ?: throw
		EntityNotFoundException("Пользователь с email '$creatorEmail' не найден")
		
		// Проверка уникальности нового имени
		if (currentName != newName && groupRepository.existsByName(newName)) {
			throw IllegalArgumentException("Группа с именем '$newName' уже существует")
		}
		
		// При смене создателя добавляем его в участники, если он там отсутствует
		if (group.creator.id != creator.id && !group.members.any { it.id == creator.id }) {
			group.members.add(creator)
		}
		
		group.name = newName
		group.creator = creator
		groupRepository.save(group)
		
		logger.info("Группа успешно обновлена: '$currentName' -> '$newName'")
	}
	
	/**
	 * Удаление группы
	 */
	fun delete(group: Group?) {
		requireNotNull(group) { "Группа для удаления не указана" }
		logger.info("Удаление группы '${group.name}' (ID: ${group.id})")
		groupRepository.delete(group)
	}
	
	/**
	 * Добавление пользователя в группу по email
	 */
	fun includeUserToGroupByEmail(userEmail: String, groupName: String) {
		logger.info("Добавление пользователя $userEmail в группу '$groupName'")
		
		val user = userRepository.findByEmail(userEmail) ?: throw
		EntityNotFoundException("Пользователь с email '$userEmail' не найден")
		
		val group = groupRepository.findByName(groupName) ?: throw
		EntityNotFoundException("Группа '$groupName' не найдена")
		
		// Проверка дублирования
		if (group.members.any { it.id == user.id }) {
			throw IllegalArgumentException("Пользователь '$userEmail' уже состоит в группе '$groupName'")
		}
		
		group.members.add(user)
		groupRepository.save(group)
		
		logger.info("Пользователь $userEmail добавлен в группу '${group.name}'")
	}
	
	/**
	 * Исключение пользователя из группы по email
	 */
	fun excludeUserFromGroupByEmail(userEmail: String, groupName: String) {
		logger.info("Исключение пользователя $userEmail из группы '$groupName'")
		
		val user = userRepository.findByEmail(userEmail) ?: throw
		EntityNotFoundException("Пользователь с email '$userEmail' не найден")
		
		val group = groupRepository.findByName(groupName) ?: throw
		EntityNotFoundException("Группа '$groupName' не найдена")
		
		// Проверка существования в группе
		if (!group.members.any { it.id == user.id }) {
			throw IllegalArgumentException("Пользователь '$userEmail' не состоит в группе '$groupName'")
		}
		
		// Запрет на исключение создателя
		if (group.creator.id == user.id) {
			throw IllegalStateException("Невозможно исключить создателя группы '$groupName'")
		}
		
		group.members.removeIf { it.id == user.id }
		groupRepository.save(group)
		
		logger.info("Пользователь $userEmail исключён из группы '${group.name}'")
	}
	
	/**
	 * Получение участников группы (старый метод для совместимости)
	 */
	fun getUsers(group: Group?): List<User> {
		requireNotNull(group) { "Группа не указана" }
		requireNotNull(group.id) { "У группы не определён ID" }
		
		return groupRepository.findUsersInGroup(group.id!!)
	}
	
	/**
	 * Проверка на существование группы
	 */
	fun existsByName(name: String): Boolean = groupRepository.existsByName(name)
	/**
	 * Получение группы по названию
	 */
	fun findByName(name: String): Group? = groupRepository.findByName(name)
	/**
	 * Получение групп по Id пользователя
	 */
	fun findByMemberId(userId: Int): List<Group> = groupRepository.findByMemberId(userId)
}