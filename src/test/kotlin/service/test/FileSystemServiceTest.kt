package service.test

import org.zak.dto.CurrentUser
import org.zak.entity.Group
import org.zak.entity.User
import org.zak.repository.DeletedFileRepository
import org.zak.repository.DirectoryMetadataRepository
import org.zak.repository.FileMetadataRepository
import org.zak.service.AccessType
import org.zak.service.FileSystemService
import org.zak.service.GroupService
import org.zak.service.UserService
import jakarta.persistence.EntityNotFoundException
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.ArgumentMatchers.any
import org.mockito.ArgumentMatchers.anyString
import org.mockito.ArgumentMatchers.eq
import org.mockito.Mock
import org.mockito.Mockito.doReturn
import org.mockito.Mockito.`when`
import org.mockito.junit.jupiter.MockitoExtension
import java.io.File
import java.nio.file.Files
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@ExtendWith(MockitoExtension::class)
class FileSystemServiceTest {
	
	@Mock
	private lateinit var deletedFileRepository: DeletedFileRepository
	
	@Mock
	private lateinit var fileMetadataRepository: FileMetadataRepository
	
	@Mock
	private lateinit var directoryMetadataRepository: DirectoryMetadataRepository
	
	@Mock
	private lateinit var groupService: GroupService
	
	@Mock
	private lateinit var userService: UserService
	
	private lateinit var fileSystemService: FileSystemService
	
	@BeforeEach
	fun setUp() {
		// Создаем временные директории для тестов
		val testFilesDir = Files.createTempDirectory("test-files").toFile()
		val testDeletedDir = Files.createTempDirectory("test-deleted").toFile()
		
		testFilesDir.deleteOnExit()
		testDeletedDir.deleteOnExit()
		
		// Создаем директорию groups внутри test-files
		val groupsDir = File(testFilesDir, "groups")
		groupsDir.mkdirs()
		
		// Создаем файловый сервис с тестовыми путями
		fileSystemService = FileSystemService(
			deletedFileRepository, fileMetadataRepository,
			directoryMetadataRepository, groupService, userService
		)
		
		// Устанавливаем тестовые пути через reflection
		fileSystemService.javaClass.getDeclaredField("rootDirectory").apply {
			isAccessible = true
			set(fileSystemService, testFilesDir.absolutePath)
		}
		
		fileSystemService.javaClass.getDeclaredField("rootDirectoryDeleted").apply {
			isAccessible = true
			set(fileSystemService, testDeletedDir.absolutePath)
		}
		
		// Вызываем init() для инициализации
		fileSystemService.init()
	}
	
	@Test
	fun `checkAccessForDirectory should return ALL for admin in root`() {
		// Arrange - используем реального админа из базы (Id = 2)
		val currentUser = CurrentUser(
			id = 2,  // Артем Сергеевич Иванов - администратор
			email = "Ivanov.AS@example.com",
			isAdmin = true,
			userDetails = null
		)
		val path = ""
		
		// Act
		val result = fileSystemService.checkAccessForDirectory(currentUser, path)
		
		// Assert
		assertEquals(AccessType.ALL.value, result)
	}
	
	@Test
	fun `checkAccessForDirectory should return correct permissions with metadata overrides - simplified`() {
		// Arrange
		val groupName = "skebob"
		
		val regularUser = User(
			surname = "Иванов",
			name = "Иван",
			patronymic = "Иванович",
			email = "Ivan@mail.ru",
			passwordHash = "hash",
			createdAt = LocalDateTime.now()
		)
		regularUser.id = 1
		
		val group = Group(name = groupName, creator = regularUser)
		group.id = 2
		
		val restrictedPath = "groups/$groupName/restricted"
		val restrictedMetadata = org.zak.entity.DirectoryMetadata(
			path = restrictedPath,
			user = regularUser,
			group = null,
			mode = AccessType.READ.value
		)
		
		// Мокаем
		doReturn(regularUser).`when`(userService).getUserEntityById(1)
		`when`(groupService.findByName(groupName)).thenReturn(group)
		`when`(groupService.hasUserAccessToGroup(1, groupName)).thenReturn(true)
		
		// Используем any() для всех вызовов
		`when`(directoryMetadataRepository.findByPathAndGroup(anyString(), any())).thenReturn(null)
		`when`(directoryMetadataRepository.findByPathAndUser(anyString(), any())).thenReturn(null)
		
		// Переопределяем для конкретного пути
		`when`(directoryMetadataRepository.findByPathAndUser(restrictedPath, regularUser))
			.thenReturn(restrictedMetadata)
		
		val currentUser = CurrentUser(id = 1, email = "test@test.com", isAdmin = false, userDetails = regularUser)
		
		// Act
		val result = fileSystemService.checkAccessForDirectory(currentUser, restrictedPath)
		
		// Assert
		assertEquals(AccessType.READ.value, result)
	}
	
	@Test
	fun `checkAccessForDirectory should return correct permissions for group member`() {
		// Arrange
		val groupName = "testGroup"
		
		// Создаем пользователя, который является создателем группы (админ - Артем Сергеевич)
		val creator = User(
			surname = "Иванов",
			name = "Артем",
			patronymic = "Сергеевич",
			email = "Ivanov.AS@example.com",
			passwordHash = "\$2b\$12\$a0BBFHL7nR/REujbwAbp5uKyOkEO73/cqfIvB4SMNVfc9UyKtHE5K",
			createdAt = LocalDateTime.parse("2025-12-10T11:11:30")
		)
		creator.id = 2  // ID админа из базы
		
		// Создаем группу, созданную админом
		val group = Group(
			name = groupName,
			creator = creator
		)
		group.id = 1
		
		// Создаем обычного пользователя (Иван Иванович) для добавления в группу
		val user = User(
			surname = "Иванов",
			name = "Иван",
			patronymic = "Иванович",
			email = "Ivan@mail.ru",
			passwordHash = "\$2b\$12\$vdmkxEw9amxl/QE9l276ze9lSq7GQcRHHs5vOPLPeL2CbZTdm6mTm",
			createdAt = LocalDateTime.parse("2025-12-04T07:48:19")
		)
		user.id = 1
		
		// Добавляем пользователя в группу
		group.members.add(user)
		
		`when`(groupService.findByName(groupName)).thenReturn(group)
		`when`(groupService.hasUserAccessToGroup(1, groupName)).thenReturn(true)
		`when`(userService.getUserEntityById(1)).thenReturn(user)
		
		val currentUser = CurrentUser(
			id = 1,  // Иван Иванович - участник группы
			email = "Ivan@mail.ru",
			isAdmin = false,
			userDetails = null
		)
		val path = "groups/$groupName"
		
		// Act
		val result = fileSystemService.checkAccessForDirectory(currentUser, path)
		
		// Assert
		assertEquals(AccessType.ALL.value, result)
	}
	
	@Test
	fun `checkAccessForFile should throw exception when user not found`() {
		// Arrange
		`when`(userService.getUserEntityById(999)).thenReturn(null)  // Несуществующий пользователь
		
		val currentUser = CurrentUser(
			id = 999,
			email = "nonexistent@test.com",
			isAdmin = false,
			userDetails = null
		)
		
		// Act & Assert
		assertThrows(EntityNotFoundException::class.java) {
			fileSystemService.checkAccessForFile(currentUser, "path/to/file.txt", "file.txt")
		}
	}
	
	@Test
	fun `checkAccessForDirectory should return 0 for non-member accessing group directory`() {
		// Arrange
		val groupName = "testGroup"
		
		// Создаем группу
		val creator = User(
			surname = "Иванов",
			name = "Артем",
			patronymic = "Сергеевич",
			email = "Ivanov.AS@example.com",
			passwordHash = "\$2b\$12\$a0BBFHL7nR/REujbwAbp5uKyOkEO73/cqfIvB4SMNVfc9UyKtHE5K",
			createdAt = LocalDateTime.parse("2025-12-10T11:11:30")
		)
		creator.id = 2
		
		val group = Group(
			name = groupName,
			creator = creator
		)
		group.id = 1
		
		// Создаем пользователя, который НЕ входит в группу
		val nonMemberUser = User(
			surname = "Петров",
			name = "Петр",
			patronymic = "Петрович",
			email = "petrov@test.com",
			passwordHash = "hash123",
			createdAt = LocalDateTime.now()
		)
		nonMemberUser.id = 3
		
		`when`(groupService.findByName(groupName)).thenReturn(group)
		`when`(groupService.hasUserAccessToGroup(3, groupName)).thenReturn(false)  // Не является участником
		`when`(userService.getUserEntityById(3)).thenReturn(nonMemberUser)
		
		val currentUser = CurrentUser(
			id = 3,  // Не член группы
			email = "petrov@test.com",
			isAdmin = false,
			userDetails = null
		)
		val path = "groups/$groupName"
		
		// Act
		val result = fileSystemService.checkAccessForDirectory(currentUser, path)
		
		// Assert - должен вернуть 0 (нет доступа)
		assertEquals(0, result)
	}
	
	@Test
	fun `simple test for group member access`() {
		// Arrange
		val groupName = "skebob"
		
		val user = User(
			surname = "Иванов",
			name = "Иван",
			patronymic = "Иванович",
			email = "Ivan@mail.ru",
			passwordHash = "hash",
			createdAt = LocalDateTime.now()
		)
		user.id = 1
		
		val group = Group(
			name = groupName,
			creator = user
		)
		group.id = 2
		group.members.add(user)
		
		`when`(groupService.findByName(groupName)).thenReturn(group)
		`when`(groupService.hasUserAccessToGroup(1, groupName)).thenReturn(true)
		`when`(userService.getUserEntityById(1)).thenReturn(user)
		
		// Не мокаем directoryMetadataRepository - пусть возвращает null
		
		val currentUser = CurrentUser(
			id = 1,
			email = "Ivan@mail.ru",
			isAdmin = false,
			userDetails = null
		)
		val path = "groups/$groupName"
		
		// Act
		val result = fileSystemService.checkAccessForDirectory(currentUser, path)
		
		// Assert - должен быть полный доступ
		assertEquals(AccessType.ALL.value, result)
	}
	
	@Test
	fun `isRootDirectory should return true for empty path`() {
		// Arrange
		val path = ""
		
		// Act
		val result = fileSystemService.isRootDirectory(path)
		
		// Assert
		assertTrue(result)
	}
	
	@Test
	fun `isGroupsDirectory should return true for groups path`() {
		// Arrange
		val path = "groups"
		
		// Act
		val result = fileSystemService.isGroupsDirectory(path)
		
		// Assert
		assertTrue(result)
	}
	
	@Test
	fun `extractGroupFromPath should return group name for valid path`() {
		// Arrange
		val path = "groups/testGroup/some/folder"
		
		// Act
		val result = fileSystemService.extractGroupFromPath(path)
		
		// Assert
		assertEquals("testGroup", result)
	}
}