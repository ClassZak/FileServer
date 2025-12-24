package service.test

import jakarta.persistence.EntityNotFoundException
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.junit.jupiter.api.io.TempDir
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
import java.nio.file.Path
import java.time.LocalDateTime

@ExtendWith(MockitoExtension::class)
class FileSystemServiceTest {
	
	@Mock lateinit var deletedFileRepository: DeletedFileRepository
	@Mock lateinit var fileMetadataRepository: FileMetadataRepository
	@Mock lateinit var directoryMetadataRepository: DirectoryMetadataRepository
	@Mock lateinit var groupService: GroupService
	@Mock lateinit var userService: UserService
	
	private lateinit var fileSystemService: FileSystemService
	
	@TempDir
	lateinit var tempDir: Path
	@TempDir
	lateinit var tempDeletedDir: Path
	
	@BeforeEach
	fun setUp() {
		val root = Files.createTempDirectory("test-files").toFile()
		val deleted = Files.createTempDirectory("test-deleted").toFile()
		
		File(root, "groups").mkdirs()
		
		// Устанавливаем временные директории через рефлексию
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
		// Инициализируем сервис
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
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	// --------------------------------------------------
	// Тесты для moveItem
	// --------------------------------------------------
	
	@Test
	fun `moveItem should move file successfully`() {
		// Подготовка: создаем файл в корневой директории сервиса
		val sourceFile = File(tempDir.toFile(), "test.txt")
		sourceFile.writeText("Test content")
		
		val result = invokeMoveItem(sourceFile.absolutePath, tempDeletedDir.toFile())
		
		// Проверка
		assertTrue(result)
		assertFalse(sourceFile.exists())
		assertTrue(File(tempDeletedDir.toFile(), "test.txt").exists())
		assertEquals("Test content", File(tempDeletedDir.toFile(), "test.txt").readText())
	}
	
	@Test
	fun `moveItem should move file with subdirectory structure`() {
		// Подготовка
		val subDir = File(tempDir.toFile(), "fdgdfg")
		subDir.mkdirs()
		val sourceFile = File(subDir, "vvxcvxcvxv.txt")
		sourceFile.writeText("Content with path")
		
		val result = invokeMoveItem(sourceFile.absolutePath, tempDeletedDir.toFile())
		
		// Проверка
		assertTrue(result)
		assertFalse(sourceFile.exists())
		val movedFile = File(tempDeletedDir.toFile(), "fdgdfg/vvxcvxcvxv.txt")
		assertTrue(movedFile.exists())
		assertEquals("Content with path", movedFile.readText())
	}
	
	@Test
	fun `moveItem should move directory recursively`() {
		// Подготовка
		val sourceDir = File(tempDir.toFile(), "folder1")
		sourceDir.mkdirs()
		
		File(sourceDir, "file1.txt").writeText("File 1")
		File(sourceDir, "file2.txt").writeText("File 2")
		
		val subDir = File(sourceDir, "subfolder")
		subDir.mkdirs()
		File(subDir, "file3.txt").writeText("File 3")
		
		val result = invokeMoveItem(sourceDir.absolutePath, tempDeletedDir.toFile())
		
		// Проверка
		assertTrue(result)
		assertFalse(sourceDir.exists())
		
		val movedDir = File(tempDeletedDir.toFile(), "folder1")
		assertTrue(movedDir.exists())
		assertTrue(File(movedDir, "file1.txt").exists())
		assertTrue(File(movedDir, "file2.txt").exists())
		assertTrue(File(movedDir, "subfolder/file3.txt").exists())
	}
	
	@Test
	fun `moveItem should return false when source does not exist`() {
		// Подготовка
		val nonExistentPath = File(tempDir.toFile(), "ghost.txt").absolutePath
		
		// Выполнение
		val result = invokeMoveItem(nonExistentPath, tempDeletedDir.toFile())
		
		// Проверка
		assertFalse(result)
	}
	
	@Test
	fun `moveItem should return false when source is outside root directory`() {
		// Подготовка
		val externalFile = File.createTempFile("external", ".txt")
		externalFile.writeText("External content")
		
		try {
			// Выполнение
			val result = invokeMoveItem(externalFile.absolutePath, tempDeletedDir.toFile())
			
			// Проверка
			assertFalse(result)
			assertTrue(externalFile.exists()) // Файл не должен быть удален
		} finally {
			externalFile.delete()
		}
	}
	
	@Test
	fun `moveItem should overwrite existing file`() {
		// Подготовка
		val sourceFile = File(tempDir.toFile(), "duplicate.txt")
		sourceFile.writeText("New content")
		
		val targetDir = tempDeletedDir.toFile()
		val existingFile = File(targetDir, "duplicate.txt")
		existingFile.parentFile?.mkdirs()
		existingFile.writeText("Old content")
		
		val result = invokeMoveItem(sourceFile.absolutePath, targetDir)
		
		// Проверка
		assertTrue(result)
		assertFalse(sourceFile.exists())
		assertTrue(existingFile.exists())
		assertEquals("New content", existingFile.readText())
	}
	
	@Test
	fun `moveItem should merge directories when target exists`() {
		// Подготовка
		val sourceDir = File(tempDir.toFile(), "shared")
		sourceDir.mkdirs()
		File(sourceDir, "file1.txt").writeText("From source")
		File(sourceDir, "unique.txt").writeText("Unique file")
		
		val targetDir = tempDeletedDir.toFile()
		val existingDir = File(targetDir, "shared")
		existingDir.mkdirs()
		File(existingDir, "file1.txt").writeText("Existing file")
		File(existingDir, "file2.txt").writeText("Another file")
		
		val result = invokeMoveItem(sourceDir.absolutePath, targetDir)
		
		// Проверка
		assertTrue(result)
		assertFalse(sourceDir.exists())
		
		// Проверяем, что файлы объединились
		val finalDir = File(targetDir, "shared")
		assertTrue(finalDir.exists())
		
		// file1.txt должен быть перезаписан
		assertEquals("From source", File(finalDir, "file1.txt").readText())
		// Остальные файлы должны сохраниться
		assertTrue(File(finalDir, "file2.txt").exists())
		assertTrue(File(finalDir, "unique.txt").exists())
	}
	
	@Test
	fun `moveItem should create parent directories if they dont exist`() {
		// Подготовка
		val sourceFile = File(tempDir.toFile(), "deep/nested/path/file.txt")
		sourceFile.parentFile.mkdirs()
		sourceFile.writeText("Deep content")
		
		val result = invokeMoveItem(sourceFile.absolutePath, tempDeletedDir.toFile())
		
		// Проверка
		assertTrue(result)
		assertFalse(sourceFile.exists())
		
		val movedFile = File(tempDeletedDir.toFile(), "deep/nested/path/file.txt")
		assertTrue(movedFile.exists())
		assertTrue(movedFile.parentFile.exists())
		assertEquals("Deep content", movedFile.readText())
	}
	
	@Test
	fun `moveItem should handle empty directory`() {
		// Подготовка
		val sourceDir = File(tempDir.toFile(), "empty_folder")
		sourceDir.mkdirs()
		
		val result = invokeMoveItem(sourceDir.absolutePath, tempDeletedDir.toFile())
		
		// Проверка
		assertTrue(result)
		assertFalse(sourceDir.exists())
		assertTrue(File(tempDeletedDir.toFile(), "empty_folder").exists())
		assertTrue(File(tempDeletedDir.toFile(), "empty_folder").isDirectory)
	}
	
	@Test
	fun `moveItem should preserve file permissions and timestamps as much as possible`() {
		// Подготовка
		val sourceFile = File(tempDir.toFile(), "timestamp.txt")
		sourceFile.writeText("Test")
		
		// Устанавливаем время последнего изменения
		val lastModified = System.currentTimeMillis() - 100000
		sourceFile.setLastModified(lastModified)
		
		val result = invokeMoveItem(sourceFile.absolutePath, tempDeletedDir.toFile())
		
		// Проверка
		assertTrue(result)
		val movedFile = File(tempDeletedDir.toFile(), "timestamp.txt")
		assertTrue(movedFile.exists())
		
		// Проверяем, что содержимое сохранено
		assertEquals("Test", movedFile.readText())
		
		// Временные метки могут быть приблизительно сохранены
		val movedTime = movedFile.lastModified()
		assertTrue(
			Math.abs(movedTime - lastModified) < 2000, // 2 секунды допуск
			"Timestamp should be preserved within 2 seconds. Original: $lastModified, moved: $movedTime"
		)
	}
	
	@Test
	fun `moveItem should use default target directory when not specified`() {
		// Подготовка
		val sourceFile = File(tempDir.toFile(), "default_target.txt")
		sourceFile.writeText("Default test")
		
		// Получаем путь к deleted_files директории через рефлексию
		val deletedFilesDirField = fileSystemService.javaClass.getDeclaredField("deletedFilesDir")
		deletedFilesDirField.isAccessible = true
		val deletedFilesDir = deletedFilesDirField.get(fileSystemService) as String
		
		// Создаем targetDir, который используется по умолчанию в методе moveItem
		val defaultTargetDir = java.nio.file.Paths.get(deletedFilesDir).toAbsolutePath().toFile()
		
		// Выполнение - вызываем с двумя параметрами
		val result = invokeMoveItem(sourceFile.absolutePath, defaultTargetDir)
		
		// Проверка
		assertTrue(result)
		assertFalse(sourceFile.exists())
		val movedFile = File(defaultTargetDir, "default_target.txt")
		assertTrue(movedFile.exists())
	}
	
	@Test
	fun `moveItem should handle symlinks appropriately`() {
		// Этот тест может не работать на Windows
		if (!System.getProperty("os.name").toLowerCase().contains("win")) {
			// Подготовка
			val realFile = File(tempDir.toFile(), "real.txt")
			realFile.writeText("Real content")
			
			val linkFile = File(tempDir.toFile(), "link.txt")
			try {
				Files.createSymbolicLink(linkFile.toPath(), realFile.toPath())
			} catch (e: Exception) {
				// Если не можем создать символическую ссылку, пропускаем тест
				println("Cannot create symbolic link: ${e.message}")
				return
			}
			
			val result = invokeMoveItem(linkFile.absolutePath, tempDeletedDir.toFile())
			
			// Проверка
			assertTrue(result)
			assertFalse(linkFile.exists())
			
			val movedFile = File(tempDeletedDir.toFile(), "link.txt")
			assertTrue(movedFile.exists())
			
			// Проверяем, что это не символическая ссылка (она должна быть скопирована как обычный файл)
			assertTrue(movedFile.isFile)
			assertEquals("Real content", movedFile.readText())
			
			// Оригинальный файл должен остаться
			assertTrue(realFile.exists())
		}
	}
	
	// --------------------------------------------------
	// Вспомогательные методы
	// --------------------------------------------------
	
	/**
	 * Вызывает приватный метод moveItem через рефлексию
	 */
	private fun invokeMoveItem(sourcePath: String, targetDir: File): Boolean {
		val method = fileSystemService.javaClass.getDeclaredMethod(
			"moveItem",
			String::class.java,
			File::class.java
		)
		method.isAccessible = true
		return method.invoke(fileSystemService, sourcePath, targetDir) as Boolean
	}
}
