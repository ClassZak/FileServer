package service.test

import org.mockito.kotlin.argumentCaptor
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
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
import java.time.LocalDateTime

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
	// REGULAR USER ACCESS TO ROOT AND GROUPS
	// --------------------------------------------------
	
	@Test
	fun `regular user has READ access to root`() {
		val user = createUser(id = 1)
		val currentUser = CurrentUser(id = 1, email = user.email, isAdmin = false, userDetails = user)
		assertEquals(AccessType.READ.value, spiedService.checkAccessForDirectory(currentUser, ""))
	}
	
	@Test
	fun `regular user has READ access to groups directory`() {
		val user = createUser(id = 1)
		val currentUser = CurrentUser(id = 1, email = user.email, isAdmin = false, userDetails = user)
		assertEquals(AccessType.READ.value, spiedService.checkAccessForDirectory(currentUser, "groups"))
	}
	
	@Test
	fun `user has no access to non-existent group directory`() {
		val user = createUser(id = 1)
		val currentUser = CurrentUser(id = 1, email = user.email, isAdmin = false, userDetails = user)
		whenever(groupService.findByName("nonexistent")).thenReturn(null)
		assertEquals(AccessType.NONE.value, spiedService.checkAccessForDirectory(currentUser, "groups/nonexistent"))
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
	// MULTIPLE GROUPS AND PERMISSION INHERITANCE
	// --------------------------------------------------
	
	@Test
	fun `user with multiple groups gets combined permissions`() {
		val user = createUser(id = 1)
		val group1 = Group("group1", createUser(id = 2)).apply { id = 101 }
		val group2 = Group("group2", createUser(id = 2)).apply { id = 102 }
		whenever(userService.getUserEntityById(1)).thenReturn(user)
		whenever(groupService.findByMemberId(1)).thenReturn(listOf(group1, group2))
		
		val folder = FolderEntity(path = "shared", isDeleted = false)
		whenever(folderEntityRepository.findByPath("shared")).thenReturn(folder)
		
		val perm1 = FolderPermission(folder, null, group1, (AccessType.READ.value or AccessType.CREATE.value).toShort())
		val perm2 = FolderPermission(folder, null, group2, AccessType.DELETE.value.toShort())
		whenever(folderPermissionRepository.findByFolderEntityAndGroup(folder, group1)).thenReturn(perm1)
		whenever(folderPermissionRepository.findByFolderEntityAndGroup(folder, group2)).thenReturn(perm2)
		
		val currentUser = CurrentUser(id = 1, email = user.email, isAdmin = false, userDetails = user)
		val access = spiedService.checkAccessForDirectory(currentUser, "shared")
		assertEquals(AccessType.READ.value or AccessType.CREATE.value or AccessType.DELETE.value, access)
	}
	
	@Test
	fun `inherited permissions from parent folders are combined`() {
		val user = createUser(id = 1)
		val currentUser = CurrentUser(id = 1, email = user.email, isAdmin = false, userDetails = user)
		val parentFolder = FolderEntity(path = "parent", isDeleted = false)
		val childFolder = FolderEntity(path = "parent/child", isDeleted = false)
		
		whenever(userService.getUserEntityById(1)).thenReturn(user)
		whenever(groupService.findByMemberId(1)).thenReturn(emptyList())
		whenever(folderEntityRepository.findByPath("parent/child")).thenReturn(childFolder)
		whenever(folderEntityRepository.findByPath("parent")).thenReturn(parentFolder)
		
		val parentPerm = FolderPermission(parentFolder, user, null, AccessType.READ.value.toShort())
		val childPerm = FolderPermission(childFolder, user, null, AccessType.CREATE.value.toShort())
		whenever(folderPermissionRepository.findByFolderEntityAndUser(parentFolder, user)).thenReturn(parentPerm)
		whenever(folderPermissionRepository.findByFolderEntityAndUser(childFolder, user)).thenReturn(childPerm)
		
		val access = spiedService.checkAccessForDirectory(currentUser, "parent/child")
		assertEquals(AccessType.READ.value or AccessType.CREATE.value, access)
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
			spiedService.setFolderPermission("some/path", "user1@test.com", null, AccessType.CREATE.value, currentUser)
		}
	}
	
	@Test
	fun `setFolderPermission accepts mode zero`() {
		val currentUser = CurrentUser(id = 1, email = "u@t.com", isAdmin = true, userDetails = createUser(1))
		val folder = FolderEntity(path = "some/path", isDeleted = false)
		val user = createUser(1)
		whenever(folderEntityRepository.findByPath("some/path")).thenReturn(folder)
		whenever(userService.getUserEntityByEmail("user1@test.com")).thenReturn(user)
		whenever(folderPermissionRepository.findByFolderEntityAndUser(folder, user)).thenReturn(null)
		whenever(operationTypeRepository.findByName("CHANGE_PERMISSIONS")).thenReturn(OperationType("CHANGE_PERMISSIONS"))
		assertDoesNotThrow {
			spiedService.setFolderPermission("some/path", "user1@test.com", null, 0, currentUser)
		}
	}
	
	@Test
	fun `setFolderPermission throws when user lacks UPDATE on folder`() {
		val user = createUser(id = 1)
		val currentUser = CurrentUser(id = 1, email = user.email, isAdmin = false, userDetails = user)
		doReturn(AccessType.READ.value).whenever(spiedService).checkAccessForDirectory(currentUser, "some/path")
		assertThrows(SecurityException::class.java) {
			spiedService.setFolderPermission("some/path", "user2@test.com", null, AccessType.ALL.value, currentUser)
		}
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
		
		whenever(fileEntityRepository.findByPath("test.txt")).thenReturn(fileEntity)
		whenever(deletedFileRepository.findByFileEntityAndVersion(fileEntity, 1)).thenReturn(deletedFile)
		whenever(deletedFileRepository.findByOriginalPath("test.txt")).thenReturn(listOf(deletedFile))
		whenever(folderEntityRepository.findByPath("test.txt")).thenReturn(null)
		whenever(fileEntityRepository.save(fileEntity)).thenReturn(fileEntity)
		whenever(operationTypeRepository.findByName("RESTORE")).thenReturn(OperationType("RESTORE"))
		whenever(workHistoryRepository.save(any<WorkHistory>())).thenAnswer { it.arguments[0] }
		doReturn(deletedPath).whenever(spiedService).findDeletedFilePath(deletedFile)
		doReturn(AccessType.ALL.value).whenever(spiedService).checkAccessForDirectory(eq(currentUser), eq(""))
		
		Mockito.mockStatic(Files::class.java).use { filesMock ->
			filesMock.`when`<Boolean> { Files.exists(deletedPath) }.thenReturn(true)
			filesMock.`when`<Boolean> { Files.deleteIfExists(deletedPath) }.thenReturn(true)
			filesMock.`when`<Path> { Files.move(any(), any(), any()) }.thenReturn(null)
			
			val result = spiedService.restoreFile(currentUser, "test.txt", 1)
			assertTrue(result)
			assertFalse(fileEntity.isDeleted)
			verify(fileEntityRepository).save(fileEntity)
			verify(deletedFileRepository).deleteAll(listOf(deletedFile))
			verify(workHistoryRepository).save(any<WorkHistory>())
		}
	}
	
	@Test
	fun `restoreFile throws when original path already exists`() {
		val user = createUser(id = 1)
		val currentUser = CurrentUser(id = 1, email = user.email, isAdmin = false, userDetails = user)
		val fileEntity = FileEntity(path = "test.txt", isDeleted = true).apply { id = 100 }
		val deletedFile = DeletedFile(fileEntity, "test.txt", user, LocalDateTime.now(), 1).apply { id = 10 }
		
		whenever(fileEntityRepository.findByPath("test.txt")).thenReturn(fileEntity)
		whenever(deletedFileRepository.findByFileEntityAndVersion(fileEntity, 1)).thenReturn(deletedFile)
		doReturn(AccessType.ALL.value).whenever(spiedService).checkAccessForDirectory(eq(currentUser), eq(""))
		
		val targetFile = root.toPath().resolve("test.txt").toFile()
		targetFile.parentFile.mkdirs()
		targetFile.createNewFile()
		assertThrows(IllegalArgumentException::class.java) {
			spiedService.restoreFile(currentUser, "test.txt", 1)
		}
	}
	
	@Test
	fun `restoreFile throws when user lacks CREATE permission in parent`() {
		val user = createUser(id = 1)
		val currentUser = CurrentUser(id = 1, email = user.email, isAdmin = false, userDetails = user)
		val fileEntity = FileEntity(path = "test.txt", isDeleted = true).apply { id = 100 }
		val deletedFile = DeletedFile(fileEntity, "test.txt", user, LocalDateTime.now(), 1).apply { id = 10 }
		
		whenever(fileEntityRepository.findByPath("test.txt")).thenReturn(fileEntity)
		whenever(deletedFileRepository.findByFileEntityAndVersion(fileEntity, 1)).thenReturn(deletedFile)
		doReturn(AccessType.READ.value).whenever(spiedService).checkAccessForDirectory(eq(currentUser), eq(""))
		
		assertThrows(SecurityException::class.java) {
			spiedService.restoreFile(currentUser, "test.txt", 1)
		}
	}
	
	// --------------------------------------------------
	// RESTORE FOLDER
	// --------------------------------------------------
	
	@Test
	fun `restoreFolder successfully restores deleted folder and syncs children`() {
		val user = createUser(id = 1)
		val currentUser = CurrentUser(id = 1, email = user.email, isAdmin = false, userDetails = user)
		val folderEntity = FolderEntity(path = "folder", isDeleted = true).apply { id = 200 }
		val deletedFolder = DeletedFolder(folderEntity, "folder", user, LocalDateTime.now(), 1).apply { id = 20 }
		val childFile = FileEntity(path = "folder/file.txt", isDeleted = true).apply { id = 201 }
		val childFolder = FolderEntity(path = "folder/sub", isDeleted = true).apply { id = 202 }
		
		whenever(folderEntityRepository.findByPath("folder")).thenReturn(folderEntity)
		whenever(deletedFolderRepository.findByFolderEntityAndVersion(folderEntity, 1)).thenReturn(deletedFolder)
		whenever(deletedFolderRepository.findByOriginalPath("folder")).thenReturn(listOf(deletedFolder))
		whenever(fileEntityRepository.findByPath("folder")).thenReturn(null)
		whenever(folderEntityRepository.save(folderEntity)).thenReturn(folderEntity)
		// Мокаем, что в БД уже есть дочерние удалённые записи (их потом восстановим)
		whenever(fileEntityRepository.findByPath("folder/file.txt")).thenReturn(childFile)
		whenever(folderEntityRepository.findByPath("folder/sub")).thenReturn(childFolder)
		whenever(operationTypeRepository.findByName("RESTORE")).thenReturn(OperationType("RESTORE"))
		doReturn(AccessType.ALL.value).whenever(spiedService).checkAccessForDirectory(eq(currentUser), eq(""))
		
		Mockito.mockStatic(Files::class.java).use { filesMock ->
			val deletedPath = deleted.toPath().resolve("folder_v1_123")
			doReturn(deletedPath).whenever(spiedService).findDeletedFolderPath(deletedFolder)
			filesMock.`when`<Boolean> { Files.exists(deletedPath) }.thenReturn(true)
			// При перемещении физически создаём целевую папку с дочерними элементами
			filesMock.`when`<Path> { Files.move(eq(deletedPath), any(), any()) }.thenAnswer { invocation ->
				val targetPath = invocation.arguments[1] as Path
				targetPath.toFile().mkdirs()
				File(targetPath.toFile(), "file.txt").createNewFile()
				File(targetPath.toFile(), "sub").mkdir()
				targetPath
			}
			
			spiedService.restoreFolder(currentUser, "folder", 1)
			
			verify(folderEntityRepository).save(folderEntity)
			verify(deletedFolderRepository).deleteAll(listOf(deletedFolder))
			// Проверяем, что дочерние сущности были сохранены с isDeleted = false
			verify(fileEntityRepository).save(childFile)
			verify(folderEntityRepository).save(childFolder)
			assertFalse(childFile.isDeleted)
			assertFalse(childFolder.isDeleted)
		}
	}
	
	// --------------------------------------------------
	// PERMANENT DELETE
	// --------------------------------------------------
	
	@Test
	fun `permanentDeleteFileByPath removes file and all versions and updates history`() {
		val admin = CurrentUser(id = 1, email = "admin@t.com", isAdmin = true, userDetails = createUser(1))
		val fileEntity = FileEntity(path = "file.txt", isDeleted = true).apply { id = 100 }
		val deletedFile1 = DeletedFile(fileEntity, "file.txt", createUser(2), LocalDateTime.now(), 1).apply { id = 10 }
		val deletedFile2 = DeletedFile(fileEntity, "file.txt", createUser(2), LocalDateTime.now(), 2).apply { id = 11 }
		
		whenever(fileEntityRepository.findByPath("file.txt")).thenReturn(fileEntity)
		whenever(deletedFileRepository.findByOriginalPath("file.txt")).thenReturn(listOf(deletedFile1, deletedFile2))
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
			val deletedPath1 = deleted.toPath().resolve("file_v1_123.txt")
			val deletedPath2 = deleted.toPath().resolve("file_v2_456.txt")
			doReturn(deletedPath1).whenever(spiedService).findDeletedFilePath(deletedFile1)
			doReturn(deletedPath2).whenever(spiedService).findDeletedFilePath(deletedFile2)
			filesMock.`when`<Boolean> { Files.exists(deletedPath1) }.thenReturn(true)
			filesMock.`when`<Boolean> { Files.exists(deletedPath2) }.thenReturn(true)
			filesMock.`when`<Boolean> { Files.deleteIfExists(deletedPath1) }.thenReturn(true)
			filesMock.`when`<Boolean> { Files.deleteIfExists(deletedPath2) }.thenReturn(true)
			
			spiedService.permanentDeleteFileByPath("file.txt", admin)
			
			verify(fileEntityRepository).delete(fileEntity)
			verify(deletedFileRepository).deleteAll(listOf(deletedFile1, deletedFile2))
			verify(workHistoryRepository).save(any<WorkHistory>())
		}
	}
	
	@Test
	fun `permanentDeleteFileByPath throws for non-admin`() {
		val user = CurrentUser(id = 1, email = "user@t.com", isAdmin = false, userDetails = createUser(1))
		assertThrows(SecurityException::class.java) {
			spiedService.permanentDeleteFileByPath("file.txt", user)
		}
	}
	
	@Test
	fun `permanentDeleteFolderByPath removes folder and child elements`() {
		val admin = CurrentUser(id = 1, email = "admin@t.com", isAdmin = true, userDetails = createUser(1))
		val folderEntity = FolderEntity(path = "folder", isDeleted = true).apply { id = 200 }
		val childFile = FileEntity(path = "folder/file.txt", isDeleted = true).apply { id = 201 }
		val childFolder = FolderEntity(path = "folder/sub", isDeleted = true).apply { id = 202 }
		val deletedFolder = DeletedFolder(folderEntity, "folder", createUser(2), LocalDateTime.now(), 1).apply { id = 20 }
		
		whenever(folderEntityRepository.findByPath("folder")).thenReturn(folderEntity)
		whenever(deletedFolderRepository.findByOriginalPath("folder")).thenReturn(listOf(deletedFolder))
		whenever(fileEntityRepository.findByPathStartingWith("folder/")).thenReturn(listOf(childFile))
		whenever(folderEntityRepository.findByPathStartingWith("folder/")).thenReturn(listOf(childFolder))
		whenever(filePermissionRepository.findByFileEntity(childFile)).thenReturn(emptyList())
		whenever(folderPermissionRepository.findByFolderEntity(childFolder)).thenReturn(emptyList())
		whenever(folderPermissionRepository.findByFolderEntity(folderEntity)).thenReturn(emptyList())
		whenever(workHistoryRepository.findAll()).thenReturn(mutableListOf())
		
		Mockito.mockStatic(Files::class.java).use { filesMock ->
			val deletedPath = deleted.toPath().resolve("folder_v1_123")
			doReturn(deletedPath).whenever(spiedService).findDeletedFolderPath(deletedFolder)
			filesMock.`when`<Boolean> { Files.exists(deletedPath) }.thenReturn(true)
			
			spiedService.permanentDeleteFolderByPath("folder", admin)
			
			verify(fileEntityRepository).delete(childFile)
			verify(folderEntityRepository).delete(childFolder)
			verify(folderEntityRepository).delete(folderEntity)
			verify(deletedFolderRepository).deleteAll(listOf(deletedFolder))
		}
	}
	
	// --------------------------------------------------
	// GET DELETED VERSIONS
	// --------------------------------------------------
	
	@Test
	fun `getDeletedFileVersionsForUser returns versions for authorized user`() {
		val user = CurrentUser(id = 1, email = "u@t.com", isAdmin = false, userDetails = createUser(1))
		val fullPath = "parent/file.txt"
		val fileEntity = FileEntity(path = fullPath, isDeleted = true).apply { id = 100 }
		val df1 = DeletedFile(fileEntity, fullPath, createUser(1), LocalDateTime.now(), 1)
		val df2 = DeletedFile(fileEntity, fullPath, createUser(1), LocalDateTime.now(), 2)
		
		whenever(fileEntityRepository.findByPath(fullPath)).thenReturn(fileEntity)
		doReturn(AccessType.READ.value).whenever(spiedService).checkAccessForFile(eq(user), eq("parent"), eq("file.txt"))
		whenever(deletedFileRepository.findByOriginalPath(fullPath)).thenReturn(listOf(df1, df2))
		
		val versions = spiedService.getDeletedFileVersionsForUser(user, "parent", "file.txt")
		assertEquals(2, versions.size)
	}
	
	@Test
	fun `getDeletedFileVersionsForUser throws when user lacks READ`() {
		val user = CurrentUser(id = 1, email = "u@t.com", isAdmin = false, userDetails = createUser(1))
		val fullPath = "parent/file.txt"
		val fileEntity = FileEntity(path = fullPath, isDeleted = true).apply { id = 100 }
		whenever(fileEntityRepository.findByPath(fullPath)).thenReturn(fileEntity)
		doReturn(AccessType.NONE.value).whenever(spiedService).checkAccessForFile(eq(user), eq("parent"), eq("file.txt"))
		
		assertThrows(SecurityException::class.java) {
			spiedService.getDeletedFileVersionsForUser(user, "parent", "file.txt")
		}
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
		groupDir.mkdirs()
		val folderEntity = FolderEntity(path = "groups/$groupName", isDeleted = false)
		whenever(folderEntityRepository.findByPath("groups/$groupName")).thenReturn(folderEntity)
		doReturn(true).whenever(spiedService).moveItemWithVersioning(any(), any(), any(), any())
		
		spiedService.deleteGroupFolder(groupName)
		
		assertTrue(folderEntity.isDeleted)
		verify(folderEntityRepository).save(folderEntity)
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
// checkNotDeleted TESTS (creation conflict)
// --------------------------------------------------
	
	@Test
	fun `createFolder throws meaningful message when folder was previously deleted`() {
		val currentUser = CurrentUser(id = 1, email = "u@t.com", isAdmin = true, userDetails = createUser(1))
		val existingFolder = FolderEntity(path = "deletedFolder", isDeleted = true)
		whenever(folderEntityRepository.findByPath("deletedFolder")).thenReturn(existingFolder)
		
		val exception = assertThrows(IllegalStateException::class.java) {
			spiedService.createFolderByPermissions(currentUser, "", "deletedFolder")
		}
		assertTrue(exception.message!!.contains("ранее удалена"))
	}
	
	@Test
	fun `uploadFile throws meaningful message when file was previously deleted`() {
		val currentUser = CurrentUser(id = 1, email = "u@t.com", isAdmin = true, userDetails = createUser(1))
		val existingFile = FileEntity(path = "deletedFile.txt", isDeleted = true)
		whenever(fileEntityRepository.findByPath("deletedFile.txt")).thenReturn(existingFile)
		val multipartFile = mock<MultipartFile>()
		whenever(multipartFile.originalFilename).thenReturn("deletedFile.txt")
		
		val exception = assertThrows(IllegalStateException::class.java) {
			spiedService.uploadFileByPermissions(currentUser, "", multipartFile)
		}
		assertTrue(exception.message!!.contains("ранее удалён"))
	}
	
	@Test
	fun `createFolder succeeds when no deleted record exists`() {
		val currentUser = CurrentUser(id = 1, email = "u@t.com", isAdmin = true, userDetails = createUser(1))
		whenever(folderEntityRepository.findByPath("newFolder")).thenReturn(null)
		doReturn(AccessType.ALL.value).whenever(spiedService).checkAccessForDirectory(eq(currentUser), eq(""))
		whenever(operationTypeRepository.findByName("CREATE")).thenReturn(OperationType("CREATE"))
		
		// Папка физически создаётся в temp директории
		assertDoesNotThrow {
			spiedService.createFolderByPermissions(currentUser, "", "newFolder")
		}
	}
	
	@Test
	fun `uploadFile succeeds when no deleted record exists`() {
		val currentUser = CurrentUser(id = 1, email = "u@t.com", isAdmin = true, userDetails = createUser(1))
		whenever(fileEntityRepository.findByPath("newfile.txt")).thenReturn(null)
		doReturn(AccessType.ALL.value).whenever(spiedService).checkAccessForDirectory(eq(currentUser), eq(""))
		whenever(operationTypeRepository.findByName("UPLOAD")).thenReturn(OperationType("UPLOAD"))
		
		val multipartFile = mock<MultipartFile>()
		whenever(multipartFile.originalFilename).thenReturn("newfile.txt")
		// Мок transferTo создаёт пустой файл по переданному пути
		doAnswer { invocation ->
			val destFile = invocation.getArgument<File>(0)
			destFile.parentFile.mkdirs()
			destFile.createNewFile()
		}.whenever(multipartFile).transferTo(any<File>())
		
		assertDoesNotThrow {
			spiedService.uploadFileByPermissions(currentUser, "", multipartFile)
		}
		verify(fileEntityRepository).save(any<FileEntity>())
	}
	
	// --------------------------------------------------
	// FULL LIFECYCLE TESTS
	// --------------------------------------------------
	
	@Test
	fun `full file lifecycle - upload delete restore with versioning`() {
		val user = createUser(id = 1)
		val currentUser = CurrentUser(id = 1, email = user.email, isAdmin = false, userDetails = user)
		val fileName = "lifecycle.txt"
		val filePath = fileName
		
		// 1. upload
		whenever(fileEntityRepository.findByPath(filePath)).thenReturn(null)
		doReturn(AccessType.ALL.value).whenever(spiedService).checkAccessForDirectory(eq(currentUser), eq(""))
		whenever(operationTypeRepository.findByName("UPLOAD")).thenReturn(OperationType("UPLOAD"))
		val multipartFile = mock<MultipartFile>()
		whenever(multipartFile.originalFilename).thenReturn(fileName)
		doAnswer { invocation ->
			val destFile = invocation.getArgument<File>(0)
			destFile.parentFile.mkdirs()
			destFile.createNewFile()
		}.whenever(multipartFile).transferTo(any<File>())
		spiedService.uploadFileByPermissions(currentUser, "", multipartFile)
		val fileEntityCaptor = argumentCaptor<FileEntity>()
		verify(fileEntityRepository).save(fileEntityCaptor.capture())
		val fileEntity = fileEntityCaptor.firstValue
		
		// 2. delete
		val targetFile = root.toPath().resolve(filePath).toFile()
		assertTrue(targetFile.exists())
		doReturn(AccessType.ALL.value).whenever(spiedService).checkAccessForDirectory(eq(currentUser), eq(""))
		whenever(fileEntityRepository.findByPath(filePath)).thenReturn(fileEntity)
		whenever(deletedFileRepository.findByFileEntityOrderByVersionDesc(fileEntity)).thenReturn(emptyList())
		doReturn(true).whenever(spiedService).moveItemWithVersioning(any(), any(), any(), any())
		whenever(operationTypeRepository.findByName("DELETE")).thenReturn(OperationType("DELETE"))
		spiedService.deleteByPermissionsAndSaveCopy(currentUser, filePath)
		// Имитируем успешное перемещение в корзину – физический файл больше не должен существовать
		targetFile.delete()
		assertTrue(fileEntity.isDeleted)
		verify(deletedFileRepository).save(any<DeletedFile>())
		
		// 3. restore
		val deletedFile = DeletedFile(fileEntity, filePath, user, LocalDateTime.now(), 1)
		whenever(fileEntityRepository.findByPath(filePath)).thenReturn(fileEntity)
		whenever(deletedFileRepository.findByFileEntityAndVersion(fileEntity, 1)).thenReturn(deletedFile)
		whenever(deletedFileRepository.findByOriginalPath(filePath)).thenReturn(listOf(deletedFile))
		doReturn(AccessType.ALL.value).whenever(spiedService).checkAccessForDirectory(eq(currentUser), eq(""))
		whenever(operationTypeRepository.findByName("RESTORE")).thenReturn(OperationType("RESTORE"))
		val deletedPath = deleted.toPath().resolve("lifecycle_v1_123.txt")
		doReturn(deletedPath).whenever(spiedService).findDeletedFilePath(deletedFile)
		Mockito.mockStatic(Files::class.java).use { filesMock ->
			filesMock.`when`<Boolean> { Files.exists(deletedPath) }.thenReturn(true)
			filesMock.`when`<Boolean> { Files.deleteIfExists(deletedPath) }.thenReturn(true)
			filesMock.`when`<Path> { Files.move(any(), any(), any()) }.thenReturn(null)
			val restored = spiedService.restoreFile(currentUser, filePath, 1)
			assertTrue(restored)
			assertFalse(fileEntity.isDeleted)
			verify(deletedFileRepository).deleteAll(listOf(deletedFile))
		}
	}
	
	@Test
	fun `folder versioning - multiple deletes and restore specific version`() {
		val user = createUser(id = 1)
		val currentUser = CurrentUser(id = 1, email = user.email, isAdmin = false, userDetails = user)
		val folderPath = "proj"
		val folderEntity = FolderEntity(path = folderPath, isDeleted = false).apply { id = 200 }
		
		// Создаём физическую папку
		val targetFolder = root.toPath().resolve(folderPath).toFile()
		targetFolder.mkdirs()
		
		// первый delete
		whenever(folderEntityRepository.findByPath(folderPath)).thenReturn(folderEntity)
		doReturn(AccessType.ALL.value).whenever(spiedService).checkAccessForDirectory(eq(currentUser), eq(""))
		whenever(deletedFolderRepository.findByFolderEntityOrderByVersionDesc(folderEntity)).thenReturn(emptyList())
		doReturn(true).whenever(spiedService).moveItemWithVersioning(any(), any(), any(), any())
		whenever(operationTypeRepository.findByName("DELETE")).thenReturn(OperationType("DELETE"))
		spiedService.deleteByPermissionsAndSaveCopy(currentUser, folderPath)
		targetFolder.deleteRecursively()
		assertTrue(folderEntity.isDeleted)
		val deletedCaptor = argumentCaptor<DeletedFolder>()
		verify(deletedFolderRepository).save(deletedCaptor.capture())
		val deleted1 = deletedCaptor.firstValue
		
		// восстанавливаем первую версию
		folderEntity.isDeleted = true
		whenever(deletedFolderRepository.findByFolderEntityAndVersion(folderEntity, 1)).thenReturn(deleted1)
		whenever(deletedFolderRepository.findByOriginalPath(folderPath)).thenReturn(listOf(deleted1))
		doReturn(AccessType.ALL.value).whenever(spiedService).checkAccessForDirectory(eq(currentUser), eq(""))
		whenever(operationTypeRepository.findByName("RESTORE")).thenReturn(OperationType("RESTORE"))
		val deletedPath1 = deleted.toPath().resolve("proj_v1_123")
		doReturn(deletedPath1).whenever(spiedService).findDeletedFolderPath(deleted1)
		Mockito.mockStatic(Files::class.java).use { filesMock ->
			filesMock.`when`<Boolean> { Files.exists(deletedPath1) }.thenReturn(true)
			filesMock.`when`<Path> { Files.move(any(), any(), any()) }.thenAnswer {
				val target = it.arguments[1] as Path
				target.toFile().mkdirs()
				File(target.toFile(), "f1.txt").createNewFile()
				null
			}
			spiedService.restoreFolder(currentUser, folderPath, 1)
			assertFalse(folderEntity.isDeleted)
			verify(deletedFolderRepository).deleteAll(listOf(deleted1))
		}
		
		// второй delete (создаёт версию 2)
		folderEntity.isDeleted = false
		targetFolder.mkdirs()
		whenever(folderEntityRepository.findByPath(folderPath)).thenReturn(folderEntity)
		whenever(deletedFolderRepository.findByFolderEntityOrderByVersionDesc(folderEntity)).thenReturn(listOf(deleted1))
		spiedService.deleteByPermissionsAndSaveCopy(currentUser, folderPath)
		targetFolder.deleteRecursively()
		val deletedCaptor2 = argumentCaptor<DeletedFolder>()
		verify(deletedFolderRepository, times(2)).save(deletedCaptor2.capture())
		val deleted2 = deletedCaptor2.secondValue
		
		// проверяем версии
		whenever(folderEntityRepository.findByPath(folderPath)).thenReturn(folderEntity)
		doReturn(AccessType.READ.value).whenever(spiedService).checkAccessForDirectory(eq(currentUser), eq(folderPath))
		whenever(deletedFolderRepository.findByOriginalPath(folderPath)).thenReturn(listOf(deleted2))
		val versions = spiedService.getDeletedFolderVersionsForUser(currentUser, folderPath)
		assertEquals(1, versions.size)
		assertEquals(2, versions[0].version)
	}

	// --------------------------------------------------
	// ADDITIONAL PERMISSION TESTS
	// --------------------------------------------------
	
	@Test
	fun `non-member cannot delete file in group folder`() {
		val user = createUser(id = 3)
		val currentUser = CurrentUser(id = 3, email = user.email, isAdmin = false, userDetails = user)
		// Создаём физический файл, чтобы пройти проверку существования в deleteByPermissionsAndSaveCopy
		val file = root.toPath().resolve("groups/g/file.txt").toFile()
		file.parentFile.mkdirs()
		file.createNewFile()
		// Мокаем проверку прав – она вернёт NONE, что вызовет SecurityException
		doReturn(AccessType.NONE.value).whenever(spiedService).checkAccessForDirectory(eq(currentUser), eq("groups/g"))
		assertThrows(SecurityException::class.java) {
			spiedService.deleteByPermissionsAndSaveCopy(currentUser, "groups/g/file.txt")
		}
	}
	
	@Test
	fun `group member cannot restrict group permissions on group folder`() {
		val user = createUser(id = 1)
		val group = Group("g", user).apply { id = 10; members.add(user) }
		val currentUser = CurrentUser(id = 1, email = user.email, isAdmin = false, userDetails = user)
		doReturn(AccessType.READ.value).whenever(spiedService).checkAccessForDirectory(eq(currentUser), eq("groups/g"))
		assertThrows(SecurityException::class.java) {
			spiedService.setFolderPermission("groups/g", null, "g", AccessType.READ.value, currentUser)
		}
	}
	
	@Test
	fun `admin can change permissions anywhere`() {
		val admin = CurrentUser(id = 1, email = "admin@t.com", isAdmin = true, userDetails = createUser(1))
		val folder = FolderEntity(path = "any/folder", isDeleted = false)
		val targetUser = createUser(2)
		whenever(folderEntityRepository.findByPath("any/folder")).thenReturn(folder)
		whenever(userService.getUserEntityByEmail("user2@test.com")).thenReturn(targetUser)
		whenever(operationTypeRepository.findByName("CHANGE_PERMISSIONS")).thenReturn(OperationType("CHANGE_PERMISSIONS"))
		doReturn(AccessType.ALL.value).whenever(spiedService).checkAccessForDirectory(eq(admin), eq("any/folder"))
		assertDoesNotThrow {
			spiedService.setFolderPermission("any/folder", "user2@test.com", null, AccessType.READ.value, admin)
		}
		verify(folderPermissionRepository).save(any<FolderPermission>())
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