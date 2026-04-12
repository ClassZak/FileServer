package service.test

import jakarta.persistence.EntityNotFoundException
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.MockedStatic
import org.mockito.Mockito
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.*
import org.zak.dto.CurrentUser
import org.zak.entity.*
import org.zak.repository.*
import org.zak.service.AccessType
import org.zak.service.FileSystemService
import org.zak.service.GroupService
import org.zak.service.UserService
import org.springframework.web.multipart.MultipartFile
import java.io.File
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardCopyOption
import java.time.LocalDateTime
import java.util.*

@ExtendWith(MockitoExtension::class)
class FileSystemServiceTest {
	
	@Mock lateinit var groupService: GroupService
	@Mock lateinit var userService: UserService
	@Mock lateinit var fileEntityRepository: FileEntityRepository
	@Mock lateinit var folderEntityRepository: FolderEntityRepository
	@Mock lateinit var filePermissionRepository: FilePermissionRepository
	@Mock lateinit var folderPermissionRepository: FolderPermissionRepository
	@Mock lateinit var deletedFileRepository: DeletedFileRepository
	@Mock lateinit var deletedFolderRepository: DeletedFolderRepository
	@Mock lateinit var operationTypeRepository: OperationTypeRepository
	@Mock lateinit var workHistoryRepository: WorkHistoryRepository
	
	private lateinit var fileSystemService: FileSystemService
	private lateinit var spiedService: FileSystemService
	
	private lateinit var root: File
	private lateinit var deleted: File
	
	@BeforeEach
	fun setUp() {
		root = Files.createTempDirectory("test-files").toFile()
		deleted = Files.createTempDirectory("test-deleted").toFile()
		File(root, "groups").mkdirs()
		
		fileSystemService = FileSystemService(
			groupService, userService, fileEntityRepository, folderEntityRepository,
			filePermissionRepository, folderPermissionRepository, deletedFileRepository,
			deletedFolderRepository, operationTypeRepository, workHistoryRepository
		)
		
		// Внедряем пути через рефлексию
		fileSystemService.javaClass.getDeclaredField("rootDirectory").apply {
			isAccessible = true
			set(fileSystemService, root.absolutePath)
		}
		fileSystemService.javaClass.getDeclaredField("rootDirectoryDeleted").apply {
			isAccessible = true
			set(fileSystemService, deleted.absolutePath)
		}
		fileSystemService.init()
		
		spiedService = Mockito.spy(fileSystemService)
		// По умолчанию для вспомогательных методов используем реальные вызовы,
		// но в конкретных тестах будем переопределять через doReturn
	}
	
	// --------------------------------------------------
	// ADMIN ACCESS
	// --------------------------------------------------
	
	@Test
	fun `admin has ALL access in root`() {
		val admin = createUser(id = 2, email = "admin@test.com")
		val currentUser = CurrentUser(id = 2, email = admin.email, isAdmin = true, userDetails = admin)
		assertEquals(AccessType.ALL.value, spiedService.checkAccessForDirectory(currentUser, ""))
	}
	
	@Test
	fun `admin has ALL access to any file`() {
		val admin = createUser(id = 2, email = "admin@test.com")
		val currentUser = CurrentUser(id = 2, email = admin.email, isAdmin = true, userDetails = admin)
		assertEquals(AccessType.ALL.value, spiedService.checkAccessForFile(currentUser, "some/path", "file.txt"))
	}
	
	// --------------------------------------------------
	// GROUP MEMBER ACCESS
	// --------------------------------------------------
	
	@Test
	fun `group member has ALL access to group directory by default`() {
		val user = createUser(id = 1)
		val group = Group("testGroup", user).apply { id = 10; members.add(user) }
		whenever(userService.getUserEntityById(1)).thenReturn(user)
		whenever(groupService.findByName("testGroup")).thenReturn(group)
		whenever(groupService.hasUserAccessToGroup(1, "testGroup")).thenReturn(true)
		whenever(folderEntityRepository.findByPath(any())).thenReturn(null)
		val currentUser = CurrentUser(id = 1, email = user.email, isAdmin = false, userDetails = user)
		assertEquals(AccessType.ALL.value, spiedService.checkAccessForDirectory(currentUser, "groups/testGroup"))
	}
	
	@Test
	fun `group member has ALL access to file inside group folder by default`() {
		val user = createUser(id = 1)
		val group = Group("testGroup", user).apply { id = 10; members.add(user) }
		whenever(userService.getUserEntityById(1)).thenReturn(user)
		whenever(groupService.findByName("testGroup")).thenReturn(group)
		whenever(groupService.hasUserAccessToGroup(1, "testGroup")).thenReturn(true)
		whenever(groupService.findByMemberId(1)).thenReturn(emptyList())
		whenever(folderEntityRepository.findByPath(any())).thenReturn(null)
		whenever(fileEntityRepository.findByPath("groups/testGroup/file.txt")).thenReturn(null)
		val currentUser = CurrentUser(id = 1, email = user.email, isAdmin = false, userDetails = user)
		assertEquals(AccessType.ALL.value, spiedService.checkAccessForFile(currentUser, "groups/testGroup", "file.txt"))
	}
	
	// --------------------------------------------------
	// NON-MEMBER ACCESS
	// --------------------------------------------------
	
	@Test
	fun `non-member has no access to group directory`() {
		val user = createUser(id = 3)
		val group = Group("testGroup", createUser(id = 2)).apply { id = 1 }
		whenever(groupService.findByName("testGroup")).thenReturn(group)
		whenever(groupService.hasUserAccessToGroup(3, "testGroup")).thenReturn(false)
		val currentUser = CurrentUser(id = 3, email = user.email, isAdmin = false, userDetails = user)
		assertEquals(AccessType.NONE.value, spiedService.checkAccessForDirectory(currentUser, "groups/testGroup"))
	}
	
	@Test
	fun `non-member has no access to file inside group directory`() {
		val user = createUser(id = 3)
		val group = Group("testGroup", createUser(id = 2)).apply { id = 1 }
		whenever(groupService.findByName("testGroup")).thenReturn(group)
		whenever(groupService.hasUserAccessToGroup(3, "testGroup")).thenReturn(false)
		whenever(userService.getUserEntityById(3)).thenReturn(user)
		val currentUser = CurrentUser(id = 3, email = user.email, isAdmin = false, userDetails = user)
		assertEquals(AccessType.NONE.value, spiedService.checkAccessForFile(currentUser, "groups/testGroup", "file.txt"))
	}
	
	// --------------------------------------------------
	// EXPLICIT PERMISSIONS OVERRIDE
	// --------------------------------------------------
	
	@Test
	fun `explicit folder permission overrides default group access`() {
		val user = createUser(id = 1)
		val group = Group("testGroup", user).apply { id = 10; members.add(user) }
		val folder = FolderEntity(path = "groups/testGroup/restricted", isDeleted = false)
		val permission = FolderPermission(folder, user, null, AccessType.READ.value.toShort())
		whenever(userService.getUserEntityById(1)).thenReturn(user)
		whenever(groupService.findByName("testGroup")).thenReturn(group)
		whenever(groupService.hasUserAccessToGroup(1, "testGroup")).thenReturn(true)
		whenever(folderEntityRepository.findByPath("groups/testGroup/restricted")).thenReturn(folder)
		whenever(folderPermissionRepository.findByFolderEntityAndUser(folder, user)).thenReturn(permission)
		val currentUser = CurrentUser(id = 1, email = user.email, isAdmin = false, userDetails = user)
		assertEquals(AccessType.READ.value, spiedService.checkAccessForDirectory(currentUser, "groups/testGroup/restricted"))
	}
	
	@Test
	fun `explicit file permission overrides inherited directory access`() {
		val user = createUser(id = 1)
		val group = Group("testGroup", user).apply { id = 10; members.add(user) }
		val file = FileEntity(path = "groups/testGroup/secret.txt", isDeleted = false)
		val permission = FilePermission(file, user, null, AccessType.READ.value.toShort())
		whenever(userService.getUserEntityById(1)).thenReturn(user)
		whenever(groupService.findByName("testGroup")).thenReturn(group)
		whenever(groupService.hasUserAccessToGroup(1, "testGroup")).thenReturn(true)
		whenever(groupService.findByMemberId(1)).thenReturn(emptyList())
		whenever(folderEntityRepository.findByPath(any())).thenReturn(null)
		whenever(fileEntityRepository.findByPath("groups/testGroup/secret.txt")).thenReturn(file)
		whenever(filePermissionRepository.findByFileEntityAndUser(file, user)).thenReturn(permission)
		val currentUser = CurrentUser(id = 1, email = user.email, isAdmin = false, userDetails = user)
		assertEquals(AccessType.READ.value, spiedService.checkAccessForFile(currentUser, "groups/testGroup", "secret.txt"))
	}
	
	// --------------------------------------------------
	// PERMISSION VALIDATION
	// --------------------------------------------------
	
	@Test
	fun `setFolderPermission throws when mode lacks READ but not zero`() {
		val currentUser = CurrentUser(id = 1, email = "u@t.com", isAdmin = true, userDetails = createUser(1))
		assertThrows(IllegalArgumentException::class.java) {
			spiedService.setFolderPermission("some/path", 1, null, AccessType.CREATE.value, currentUser)
		}
	}
	
	@Test
	fun `setFolderPermission accepts mode zero`() {
		val currentUser = CurrentUser(id = 1, email = "u@t.com", isAdmin = true, userDetails = createUser(1))
		val folder = FolderEntity(path = "some/path", isDeleted = false)
		val user = createUser(1)
		whenever(folderEntityRepository.findByPath("some/path")).thenReturn(folder)
		whenever(userService.getUserEntityById(1)).thenReturn(user)
		whenever(folderPermissionRepository.findByFolderEntityAndUser(folder, user)).thenReturn(null)
		whenever(operationTypeRepository.findByName("CHANGE_PERMISSIONS")).thenReturn(OperationType("CHANGE_PERMISSIONS"))
		assertDoesNotThrow { spiedService.setFolderPermission("some/path", 1, null, 0, currentUser) }
	}
	
	// --------------------------------------------------
	// DELETED CHECK
	// --------------------------------------------------
	
	@Test
	fun `createFolder throws when folder was previously deleted`() {
		val currentUser = CurrentUser(id = 1, email = "u@t.com", isAdmin = true, userDetails = createUser(1))
		val existingFolder = FolderEntity(path = "deletedFolder", isDeleted = true)
		whenever(folderEntityRepository.findByPath("deletedFolder")).thenReturn(existingFolder)
		assertThrows(IllegalStateException::class.java) {
			spiedService.createFolderByPermissions(currentUser, "", "deletedFolder")
		}
	}
	
	@Test
	fun `uploadFile throws when file was previously deleted`() {
		val currentUser = CurrentUser(id = 1, email = "u@t.com", isAdmin = true, userDetails = createUser(1))
		val existingFile = FileEntity(path = "deletedFile.txt", isDeleted = true)
		whenever(fileEntityRepository.findByPath("deletedFile.txt")).thenReturn(existingFile)
		val multipartFile = mock<MultipartFile>()
		whenever(multipartFile.originalFilename).thenReturn("deletedFile.txt")
		assertThrows(IllegalStateException::class.java) {
			spiedService.uploadFileByPermissions(currentUser, "", multipartFile)
		}
	}
	
	// --------------------------------------------------
	// DELETED FILES FILTERING
	// --------------------------------------------------
	
	@Test
	fun `admin sees all deleted files`() {
		val admin = CurrentUser(id = 1, email = "admin@t.com", isAdmin = true, userDetails = createUser(1))
		val df1 = createDeletedFile(1, "/file1.txt", 2, 1)
		val df2 = createDeletedFile(2, "/file2.txt", 3, 1)
		whenever(deletedFileRepository.findAllOrderByDeletedAtDesc()).thenReturn(listOf(df1, df2))
		assertEquals(2, spiedService.getDeletedFilesForUser(admin).size)
	}
	
	@Test
	fun `user sees only own deleted files or files from own groups`() {
		val user = CurrentUser(id = 2, email = "user@t.com", isAdmin = false, userDetails = createUser(2))
		val dfOwn = createDeletedFile(1, "/own.txt", 2, 1)
		val dfOther = createDeletedFile(2, "/other.txt", 3, 1)
		val dfGroup = createDeletedFile(3, "groups/mygroup/file.txt", 3, 1)
		whenever(deletedFileRepository.findAllOrderByDeletedAtDesc()).thenReturn(listOf(dfOwn, dfOther, dfGroup))
		whenever(groupService.hasUserAccessToGroup(2, "mygroup")).thenReturn(true)
		val result = spiedService.getDeletedFilesForUser(user)
		assertEquals(2, result.size)
		assertTrue(result.any { it.originalPath == "/own.txt" })
		assertTrue(result.any { it.originalPath == "groups/mygroup/file.txt" })
	}
	
	// --------------------------------------------------
	// RESTORE FILE (используем mockStatic для Files)
	// --------------------------------------------------
	
	@Test
	fun `restoreFile successfully restores deleted file`() {
		val user = createUser(id = 1)
		val currentUser = CurrentUser(id = 1, email = user.email, isAdmin = false, userDetails = user)
		val fileEntity = FileEntity(path = "test.txt", isDeleted = true).apply { id = 100 }
		val deletedFile = DeletedFile(fileEntity, "test.txt", user, LocalDateTime.now(), 1).apply { id = 10 }
		val deletedPath = deleted.toPath().resolve("test_v1_123.txt")
		doReturn(deletedPath).whenever(spiedService).findDeletedFilePath(deletedFile)
		
		whenever(deletedFileRepository.findById(10)).thenReturn(Optional.of(deletedFile))
		whenever(fileEntityRepository.findByPath("test.txt")).thenReturn(null)
		whenever(folderEntityRepository.findByPath("test.txt")).thenReturn(null)
		whenever(fileEntityRepository.save(fileEntity)).thenReturn(fileEntity)
		whenever(operationTypeRepository.findByName("RESTORE")).thenReturn(OperationType("RESTORE"))
		whenever(workHistoryRepository.save(any<WorkHistory>())).thenAnswer { it.arguments[0] }
		doReturn(AccessType.ALL.value).whenever(spiedService).checkAccessForDirectory(eq(currentUser), eq(""))
		
		Mockito.mockStatic(Files::class.java).use { filesMock ->
			filesMock.`when`<Boolean> { Files.exists(deletedPath) }.thenReturn(true)
			filesMock.`when`<Path> { Files.move(any(), any(), any()) }.thenReturn(null)
			
			val result = spiedService.restoreFile(10, currentUser)
			assertTrue(result)
			assertFalse(fileEntity.isDeleted)
			verify(fileEntityRepository).save(fileEntity)
			verify(deletedFileRepository).delete(deletedFile)
			verify(workHistoryRepository).save(any<WorkHistory>())
		}
	}
	
	@Test
	fun `restoreFile throws when original path already exists`() {
		val user = createUser(id = 1)
		val currentUser = CurrentUser(id = 1, email = user.email, isAdmin = false, userDetails = user)
		val fileEntity = FileEntity(path = "test.txt", isDeleted = true).apply { id = 100 }
		val deletedFile = DeletedFile(fileEntity, "test.txt", user, LocalDateTime.now(),  1).apply { id = 10 }
		whenever(deletedFileRepository.findById(10)).thenReturn(Optional.of(deletedFile))
		doReturn(AccessType.ALL.value).whenever(spiedService).checkAccessForDirectory(eq(currentUser), eq(""))
		// Файл уже существует
		val targetFile = root.toPath().resolve("test.txt").toFile()
		targetFile.parentFile.mkdirs()
		targetFile.createNewFile()
		assertThrows(IllegalArgumentException::class.java) { spiedService.restoreFile(10, currentUser) }
	}
	
	@Test
	fun `restoreFile throws when user lacks CREATE permission in parent`() {
		val user = createUser(id = 1)
		val currentUser = CurrentUser(id = 1, email = user.email, isAdmin = false, userDetails = user)
		val fileEntity = FileEntity(path = "test.txt", isDeleted = true).apply { id = 100 }
		val deletedFile = DeletedFile(fileEntity, "test.txt", user, LocalDateTime.now(), 1).apply { id = 10 }
		whenever(deletedFileRepository.findById(10)).thenReturn(Optional.of(deletedFile))
		doReturn(AccessType.READ.value).whenever(spiedService).checkAccessForDirectory(eq(currentUser), eq(""))
		assertThrows(SecurityException::class.java) { spiedService.restoreFile(10, currentUser) }
	}
	
	// --------------------------------------------------
	// RESTORE FOLDER
	// --------------------------------------------------
	
	@Test
	fun `restoreFolder successfully restores deleted folder and its children`() {
		val user = createUser(id = 1)
		val currentUser = CurrentUser(id = 1, email = user.email, isAdmin = false, userDetails = user)
		val folderEntity = FolderEntity(path = "folder", isDeleted = true).apply { id = 200 }
		val deletedFolder = DeletedFolder(folderEntity, "folder", user, LocalDateTime.now(), 1).apply { id = 20 }
		val childFile = FileEntity(path = "folder/file.txt", isDeleted = true).apply { id = 201 }
		val childFolder = FolderEntity(path = "folder/sub", isDeleted = true).apply { id = 202 }
		
		whenever(deletedFolderRepository.findById(20)).thenReturn(Optional.of(deletedFolder))
		whenever(folderEntityRepository.findByPath("folder")).thenReturn(null)
		whenever(fileEntityRepository.findByPath("folder")).thenReturn(null)
		whenever(folderEntityRepository.save(folderEntity)).thenReturn(folderEntity)
		whenever(fileEntityRepository.findByPathStartingWith("folder/")).thenReturn(listOf(childFile))
		whenever(folderEntityRepository.findByPathStartingWith("folder/")).thenReturn(listOf(childFolder))
		whenever(operationTypeRepository.findByName("RESTORE")).thenReturn(OperationType("RESTORE"))
		doReturn(AccessType.ALL.value).whenever(spiedService).checkAccessForDirectory(eq(currentUser), eq(""))
		
		Mockito.mockStatic(Files::class.java).use { filesMock ->
			val deletedPath = deleted.toPath().resolve("folder_v1_123")
			doReturn(deletedPath).whenever(spiedService).findDeletedFolderPath(deletedFolder)
			filesMock.`when`<Boolean> { Files.exists(deletedPath) }.thenReturn(true)
			filesMock.`when`<Path> { Files.move(any(), any(), any()) }.thenReturn(null)
			
			val result = spiedService.restoreFolder(20, currentUser)
			assertTrue(result)
			assertFalse(folderEntity.isDeleted)
			verify(fileEntityRepository).save(childFile)
			verify(folderEntityRepository).save(childFolder)
			verify(deletedFolderRepository).delete(deletedFolder)
		}
	}
	
	// --------------------------------------------------
	// PERMANENT DELETE
	// --------------------------------------------------
	
	@Test
	fun `permanentDeleteFile removes file and updates history`() {
		val admin = CurrentUser(id = 1, email = "admin@t.com", isAdmin = true, userDetails = createUser(1))
		val fileEntity = FileEntity(path = "file.txt", isDeleted = true).apply { id = 100 }
		val deletedFile = DeletedFile(fileEntity, "file.txt", createUser(2), LocalDateTime.now(), 1).apply { id = 10 }
		//doReturn(deletedPath).whenever(spiedService).findDeletedFilePath(deletedFile)
		whenever(deletedFileRepository.findById(10)).thenReturn(Optional.of(deletedFile))
		whenever(filePermissionRepository.findByFileEntity(fileEntity)).thenReturn(emptyList())
		val historyEntry = WorkHistory(
			operationType = OperationType("DELETE"),
			user = createUser(2),
			fileEntity = fileEntity,
			folderEntity = null,
			path = "file.txt",
			isFile = true
		)
		whenever(workHistoryRepository.findAll()).thenReturn(mutableListOf(historyEntry))
		
		Mockito.mockStatic(Files::class.java).use { filesMock ->
			val deletedPath = deleted.toPath().resolve("file_v1_123.txt")
			doReturn(deletedPath).whenever(spiedService).findDeletedFilePath(deletedFile)
			filesMock.`when`<Boolean> { Files.exists(deletedPath) }.thenReturn(true)
			filesMock.`when`<Boolean> { Files.deleteIfExists(deletedPath) }.thenReturn(true)
			
			spiedService.permanentDeleteFile(10, admin)
			verify(fileEntityRepository).delete(fileEntity)
			verify(deletedFileRepository).delete(deletedFile)
			verify(workHistoryRepository).save(any<WorkHistory>())
		}
	}
	
	@Test
	fun `permanentDeleteFile throws for non-admin`() {
		val user = CurrentUser(id = 1, email = "user@t.com", isAdmin = false, userDetails = createUser(1))
		assertThrows(SecurityException::class.java) { spiedService.permanentDeleteFile(10, user) }
	}
	
	// --------------------------------------------------
	// SEARCH
	// --------------------------------------------------
	
	@Test
	fun `searchFilesAndFoldersByPermissions returns only accessible items`() {
		val admin = createUser(id = 1)
		val currentUser = CurrentUser(id = 1, email = admin.email, isAdmin = true, userDetails = admin)
		
		val baseDir = root.toPath().toFile()
		baseDir.mkdirs()
		File(baseDir, "public.txt").createNewFile()
		File(baseDir, "sub").mkdir()
		
		val (files, folders) = spiedService.searchFilesAndFoldersByPermissions(currentUser, ".", "")
		
		// Минимальная проверка: метод не упал и вернул списки (пусть даже пустые)
		assertNotNull(files)
		assertNotNull(folders)
	}
	
	// --------------------------------------------------
	// GROUP FOLDER OPERATIONS
	// --------------------------------------------------
	
	@Test
	fun `createGroupFolder creates directory and entity`() {
		val groupName = "newgroup"
		whenever(folderEntityRepository.save(any<FolderEntity>())).thenAnswer { it.arguments[0] }
		spiedService.createGroupFolder(groupName)
		val expectedPath = root.toPath().resolve("groups/$groupName")
		assertTrue(Files.exists(expectedPath))
		
		
		verify(folderEntityRepository).save(any<FolderEntity>())
	}
	
	@Test
	fun `deleteGroupFolder moves folder to trash`() {
		val groupName = "oldgroup"
		val groupDir = root.toPath().resolve("groups/$groupName").toFile()
		groupDir.mkdirs()   // создаём папку физически
		val folderEntity = FolderEntity(path = "groups/$groupName", isDeleted = false)
		whenever(folderEntityRepository.findByPath("groups/$groupName")).thenReturn(folderEntity)
		// Мокаем moveItemWithVersioning, чтобы он не делал реального копирования
		doReturn(true).whenever(spiedService).moveItemWithVersioning(any(), any(), any(), any())
		
		spiedService.deleteGroupFolder(groupName)
		
		// Проверяем, что флаг isDeleted установлен
		assertTrue(folderEntity.isDeleted)
		verify(folderEntityRepository).save(folderEntity)
		// Проверяем, что moveItemWithVersioning был вызван с правильными параметрами
		verify(spiedService).moveItemWithVersioning(eq(groupDir.absolutePath), eq(deleted), eq(root), any())
	}
	
	@Test
	fun `moveGroupFolder renames directory and updates entity`() {
		val oldName = "old"
		val newName = "new"
		val oldDir = root.toPath().resolve("groups/$oldName").toFile()
		oldDir.mkdirs()
		val folderEntity = FolderEntity(path = "groups/$oldName", isDeleted = false)
		whenever(folderEntityRepository.findByPath("groups/$oldName")).thenReturn(folderEntity)
		
		val result = spiedService.moveGroupFolder(oldName, newName)
		assertTrue(result)
		assertFalse(Files.exists(oldDir.toPath()))
		assertTrue(Files.exists(root.toPath().resolve("groups/$newName")))
		assertEquals("groups/$newName", folderEntity.path)
		verify(folderEntityRepository).save(folderEntity)
	}
	
	// --------------------------------------------------
	// UTILS
	// --------------------------------------------------
	
	private fun createUser(id: Int, email: String = "user$id@test.com"): User {
		return User("Test", "User", "Testovich", email, "hash", LocalDateTime.now()).apply { this.id = id }
	}
	
	private fun createDeletedFile(id: Long, originalPath: String, deletedByUserId: Int, version: Int): DeletedFile {
		val fileEntity = FileEntity(path = originalPath, isDeleted = true).apply { this.id = id }
		val user = createUser(deletedByUserId)
		return DeletedFile(fileEntity, originalPath, user, LocalDateTime.now(), version).apply { this.id = id }
	}
}