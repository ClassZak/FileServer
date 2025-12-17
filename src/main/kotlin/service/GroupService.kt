package org.zak.service

import jakarta.persistence.EntityNotFoundException
import org.springframework.stereotype.Service
import org.zak.controller.CounterController
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
	private val groupRepository: GroupRepository
) {
	private val logger = org.slf4j.LoggerFactory.getLogger(GroupService::class.java)
	fun create(name: String, creatorId: Int): Group{
		val user = userRepository.findById(creatorId).orElse(null)
		return create(name, user)
	}
	fun create(name: String, creator: User?): Group{
		if (creator == null)
			throw NullPointerException("Не найден пользователь для создания группы")
		
		val group = Group(
			name = name,
			creator = creator
		)
		
		if (groupRepository.findByName(name) != null)
			throw NullPointerException("Группа с именем $name уже существует")
		
		group.members.add(creator)
		return groupRepository.save(group)
	}
	
	
	/*fun read(name: String): Group?{
		val group = groupRepository.findByName(name)
		return group
	}*/
	fun read(id: Int): Group?{
		val group = groupRepository.findById(id).orElse(null)
		return group
	}
	
	
	fun update(group: Group?, name: String, creator: User?){
		if (creator == null)
			throw NullPointerException("Не найден пользователь для назначения владельцем группы")
		if (group == null)
			throw NullPointerException("Неверная ссылка на группу")
		
		if (group.name != name && groupRepository.findByName(name) != null)
			throw Exception("Группа с именем $name уже существует")
		
		group.name = name
		group.creator = creator
		
		groupRepository.save(group)
	}
	fun update(groupId: Int, name: String, creatorId: Int){
		val group = groupRepository.findById(groupId).orElse(null)
		val creator = userRepository.findById(creatorId).orElse(null)
		
		return update(group, name, creator)
	}
	fun update(groupName: String, name: String, creatorId: Int){
		val group = groupRepository.findByName(groupName)
		val creator = userRepository.findById(creatorId).orElse(null)
		
		return update(group, name, creator)
	}
	
	
	fun delete(group: Group?){
		if (group==null)
			throw NullPointerException("Неверная ссылка на группу")
		
		groupRepository.delete(group)
	}
	/**
	 * Получает все группы, в которых состоит пользователь.
	 * Используется для отображения групп текущего пользователя.
	 */
	fun getGroupsByUser(userId: Int): List<Group> = groupRepository.findByMemberId(userId)
	fun getGroupsByUser(user: User?): List<Group> {
		requireNotNull(user) { "Пользователь не указан" }
		requireNotNull(user.id) { "У пользователя не определён ID" }
		return getGroupsByUser(user.id!!)
	}
	/**
	 * Получить все группы (только для администраторов)
	 */
	fun getAllGroups(): List<Group> = groupRepository.findAll()
	
	/**
	 * Поиск групп по шаблону имени
	 */
	fun searchGroupsByName(pattern: String): List<Group> {
		logger.info("Поиск групп по шаблону: $pattern")
		// Используем LIKE для поиска по части имени
		return groupRepository.findByNameContainingIgnoreCase(pattern)
	}
	
	/**
	 * Обновление группы по имени
	 * @param currentName текущее имя группы
	 * @param newName новое имя группы
	 * @param creatorEmail email нового создателя
	 */
	fun update(currentName: String, newName: String, creatorEmail: String) {
		logger.info("Обновление группы '$currentName' -> '$newName', новый создатель: $creatorEmail")
		
		val group = groupRepository.findByName(currentName) ?: throw
		EntityNotFoundException("Группа '$currentName' не найдена")
		
		val creator = userRepository.findByEmail(creatorEmail) ?: throw
		EntityNotFoundException("Пользователь с email '$creatorEmail' не найден")
		
		// Проверка уникальности нового имени
		if (currentName != newName && groupRepository.findByName(newName) != null) {
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
	 * Проверка членства пользователя в группе по имени группы
	 */
	fun isUserMemberOfGroup(userId: Int, groupName: String): Boolean {
		val group = groupRepository.findByName(groupName) ?: return false
		
		// Используем существующий метод репозитория
		return groupRepository.isUserMemberOfGroup(group.id!!, userId)
	}
	
	/**
	 * Получить пользователя по email (вспомогательный метод)
	 */
	fun getUserByEmail(email: String): User? = userRepository.findByEmail(email)
	
	/**
	 * Получить группу по имени (основной метод для контроллера)
	 */
	fun read(groupName: String): Group? = groupRepository.findByName(groupName)
	
	fun getUsers(group: Group?): List<User> {
		if (group==null)
			throw NullPointerException("Неверная ссылка на группу")
		if (group.id==null)
			throw NullPointerException("Неверный Id у группы")
		
		val users = groupRepository.findUsersInGroup(group.id!!)
		return users
	}
}