package service.test

import jakarta.persistence.EntityNotFoundException
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.*
import org.zak.dto.CurrentUser
import org.zak.entity.DirectoryMetadata
import org.zak.entity.Group
import org.zak.entity.User
import org.zak.repository.DeletedFileRepository
import org.zak.repository.DirectoryMetadataRepository
import org.zak.repository.FileMetadataRepository
import org.zak.service.AccessType
import org.zak.service.FileSystemService
import org.zak.service.GroupService
import org.zak.service.UserService
import java.io.File
import java.nio.file.Files
import java.time.LocalDateTime

@ExtendWith(MockitoExtension::class)
class FileSystemServiceTest {
	
	@Mock lateinit var deletedFileRepository: DeletedFileRepository
	@Mock lateinit var fileMetadataRepository: FileMetadataRepository
	@Mock lateinit var directoryMetadataRepository: DirectoryMetadataRepository
	@Mock lateinit var groupService: GroupService
	@Mock lateinit var userService: UserService
	
	private lateinit var fileSystemService: FileSystemService
	
	@BeforeEach
	fun setUp() {
		val root = Files.createTempDirectory("test-files").toFile()
		val deleted = Files.createTempDirectory("test-deleted").toFile()
		
		File(root, "groups").mkdirs()
		
		fileSystemService = FileSystemService(
			deletedFileRepository,
			fileMetadataRepository,
			directoryMetadataRepository,
			groupService,
			userService
		)
		
		fileSystemService.javaClass.getDeclaredField("rootDirectory").apply {
			isAccessible = true
			set(fileSystemService, root.absolutePath)
		}
		
		fileSystemService.javaClass.getDeclaredField("rootDirectoryDeleted").apply {
			isAccessible = true
			set(fileSystemService, deleted.absolutePath)
		}
		
		fileSystemService.init()
	}
	
	// --------------------------------------------------
	// ADMIN
	// --------------------------------------------------
	
	@Test
	fun `admin has ALL access in root`() {
		val admin = User(
			surname = "Иванов",
			name = "Артем",
			patronymic = "Сергеевич",
			email = "admin@test.com",
			passwordHash = "hash",
			createdAt = LocalDateTime.now()
		).apply { id = 2 }
		
		whenever(userService.getUserEntityById(2)).thenReturn(admin)
		
		val currentUser = CurrentUser(
			id = 2,
			email = admin.email,
			isAdmin = true,
			userDetails = null
		)
		
		val result = fileSystemService.checkAccessForDirectory(currentUser, "")
		
		assertEquals(AccessType.ALL.value, result)
	}
	
	// --------------------------------------------------
	// GROUP MEMBER
	// --------------------------------------------------
	
	@Test
	fun `group member has ALL access to group directory`() {
		val user = User(
			surname = "Иванов",
			name = "Иван",
			patronymic = "Иванович",
			email = "user@test.com",
			passwordHash = "hash",
			createdAt = LocalDateTime.now()
		).apply { id = 1 }
		
		val group = Group(
			name = "testGroup",
			creator = user
		).apply {
			id = 10
			members.add(user)
		}
		
		whenever(userService.getUserEntityById(1)).thenReturn(user)
		whenever(groupService.findByName("testGroup")).thenReturn(group)
		whenever(groupService.hasUserAccessToGroup(1, "testGroup")).thenReturn(true)
		
		val currentUser = CurrentUser(
			id = 1,
			email = user.email,
			isAdmin = false,
			userDetails = null
		)
		
		val result = fileSystemService.checkAccessForDirectory(
			currentUser,
			"groups/testGroup"
		)
		
		assertEquals(AccessType.ALL.value, result)
	}
	
	// --------------------------------------------------
	// NON MEMBER
	// --------------------------------------------------
	
	@Test
	fun `non-member has no access to group directory`() {
		val user = User(
			surname = "Петров",
			name = "Петр",
			patronymic = "Петрович",
			email = "petrov@test.com",
			passwordHash = "hash",
			createdAt = LocalDateTime.now()
		).apply { id = 3 }
		
		val creator = User(
			surname = "Admin",
			name = "Admin",
			patronymic = "",
			email = "admin@test.com",
			passwordHash = "hash",
			createdAt = LocalDateTime.now()
		).apply { id = 2 }
		
		val group = Group(
			name = "testGroup",
			creator = creator
		).apply { id = 1 }
		
		whenever(userService.getUserEntityById(3)).thenReturn(user)
		whenever(groupService.findByName("testGroup")).thenReturn(group)
		whenever(groupService.hasUserAccessToGroup(3, "testGroup")).thenReturn(false)
		
		val currentUser = CurrentUser(
			id = 3,
			email = user.email,
			isAdmin = false,
			userDetails = null
		)
		
		val result = fileSystemService.checkAccessForDirectory(
			currentUser,
			"groups/testGroup"
		)
		
		assertEquals(0, result)
	}
	
	// --------------------------------------------------
	// METADATA OVERRIDE
	// --------------------------------------------------
	
	@Test
	fun `directory metadata overrides group access`() {
		val user = User(
			surname = "Иванов",
			name = "Иван",
			patronymic = "Иванович",
			email = "user@test.com",
			passwordHash = "hash",
			createdAt = LocalDateTime.now()
		).apply { id = 1 }
		
		val group = Group("skebob", user).apply { id = 2 }
		
		val path = "groups/skebob/restricted"
		
		val metadata = DirectoryMetadata(
			path = path,
			user = user,
			group = null,
			mode = AccessType.READ.value
		)
		
		// --- user / group ---
		whenever(userService.getUserEntityById(1)).thenReturn(user)
		whenever(groupService.findByName("skebob")).thenReturn(group)
		whenever(groupService.hasUserAccessToGroup(1, "skebob")).thenReturn(true)
		
		// --- DirectoryMetadataRepository ---
		whenever(
			directoryMetadataRepository.findByPathAndUser(any(), eq(user))
		).thenAnswer {
			val p = it.getArgument<String>(0)
			if (p == path) metadata else null
		}
		
		whenever(
			directoryMetadataRepository.findByPathAndGroup(any(), eq(group))
		).thenReturn(null)
		
		val currentUser = CurrentUser(
			id = 1,
			email = user.email,
			isAdmin = false,
			userDetails = user
		)
		
		val result = fileSystemService.checkAccessForDirectory(currentUser, path)
		
		assertEquals(AccessType.READ.value, result)
	}
	
	
	// --------------------------------------------------
	// FILE ACCESS
	// --------------------------------------------------
	
	@Test
	fun `exception when user not found`() {
		whenever(userService.getUserEntityById(999)).thenReturn(null)
		
		val currentUser = CurrentUser(
			id = 999,
			email = "ghost@test.com",
			isAdmin = false,
			userDetails = null
		)
		
		assertThrows(EntityNotFoundException::class.java) {
			fileSystemService.checkAccessForFile(
				currentUser,
				"path/to/file",
				"file.txt"
			)
		}
	}
	
	// --------------------------------------------------
	// UTILS
	// --------------------------------------------------
	
	@Test
	fun `isRootDirectory returns true for empty path`() {
		assertTrue(fileSystemService.isRootDirectory(""))
	}
	
	@Test
	fun `isGroupsDirectory returns true for groups`() {
		assertTrue(fileSystemService.isGroupsDirectory("groups"))
	}
	
	@Test
	fun `extractGroupFromPath extracts group name`() {
		val result = fileSystemService.extractGroupFromPath("groups/testGroup/dir")
		assertEquals("testGroup", result)
	}
}
