# TODO.md (Backend)

## Database & Migration (Phase 1)
- [✅] **Execute new DDL script** to create tables `FileEntity`, `FolderEntity`, `FilePermission`, `FolderPermission`, `DeletedFile`, `DeletedFolder`, `OperationType`, `WorkHistory` (with `Path`, `IsFile`, `Details`).
- [✅] **Add initial `OperationType` records**: `'CREATE'`, `'READ'`, `'UPDATE'`, `'DELETE'`, `'RESTORE'`, `'CHANGE_PERMISSIONS'`, `'MOVE'`, `'RENAME'`, `'DOWNLOAD'`, `'UPLOAD'`.
- [✅] **Drop old tables** (`FileMetadata`, `DirectoryMetadata`, old `DeletedFile`, old `WorkHistory`) – *выполнено путём удаления всей БД, так как реальных данных не было*.
- [✅] **Update `application.properties`** with new database name `FileServer1` and connection settings.

## Core JPA Entities (Phase 2)
- [✅] **Create new Kotlin entity classes** matching the new schema.
- [✅] **Update relationships** in `User`, `Group`, `Administrator` to remove old mappings and add new ones.

## Repository Layer (Phase 3)
- [✅] **Create/update repository interfaces**.
- [✅] **Add custom query methods** for permission checking.

## Service Layer Refactoring (Phase 4) – Critical
- [✅] **Rewrite `FileSystemService`** to use new entities and repositories.
- [✅] **Refactor `GroupService` and `UserService`** to remove dependencies on old metadata entities.
- [✅] **Create new service methods for permission management** (set, delete).
- [✅] **Create service methods for history and deleted items retrieval**.
- [⚠️] **Add service methods for reading permissions** (`getFolderPermissions`, `getFilePermissions`, `getGroupPermissions`). *Методы написаны, но контроллеры ещё не добавлены.*

## API Endpoints (Phase 5)
- [✅] **Update existing file endpoints** to use new service methods.
- [✅] **Add new endpoints in `FileController`**:
	- `GET /api/files/deleted/files`
	- `GET /api/files/deleted/folders`
	- `POST /api/files/restore/file` (by `originalPath` and `version`)
	- `POST /api/files/restore/folder`
	- `GET /api/files/deleted/file/versions?parentPath=&fileName=`
	- `GET /api/files/deleted/folder/versions?path=`
- [⚠️] **Add permission management endpoints (admin only)** – *реализованы только установка и удаление, отсутствуют эндпоинты чтения:*
	- `PUT /api/files/permissions/folder`
	- `DELETE /api/files/permissions/folder/{id}`
	- `PUT /api/files/permissions/file`
	- `DELETE /api/files/permissions/file/{id}`
	- ❌ `GET /api/files/permissions/folder?path=` – *не добавлен*
	- ❌ `GET /api/files/permissions/file?path=` – *не добавлен*
	- ❌ `GET /api/files/permissions/group/{groupId}` – *не добавлен*
- [✅] **Add history endpoint**:
	- `GET /api/files/history` – *обновлён: фильтр `userEmail`, ответ возвращает `HistoryInfo` без ID сущностей.*

## Security & Access Control (Phase 6)
- [✅] **Implement permission inheritance** logic.
- [✅] **Restrict non‑admin users** from viewing others' deleted files/history unless they share group access.
- [⚠️] **Replace numeric IDs with path‑based identifiers for trash operations**:
	- `restoreFile`, `restoreFolder`, `permanentDeleteFile`, `permanentDeleteFolder` – *переведены на пути.*
	- *Для permission management всё ещё используется числовой `permissionId` при удалении.*
	- *Нет эндпоинтов для чтения прав, вследствие чего отсутствует возможность увидеть назначенные права без ID.*

## Testing (Phase 7)
- [✅] **Update existing unit tests** (`FileSystemServiceTest`) to mock new repositories.
- [✅] **Write comprehensive unit tests** (42+ tests) covering major scenarios.
- [❌] **Write integration tests** for new endpoints (e.g., using `@SpringBootTest` and `TestRestTemplate`).
- [❌] **Test data migration** script. *(Not required – fresh database used)*

## Documentation & Cleanup (Phase 8)
- [✅] **Add full KDoc documentation** to all public methods in `FileSystemService` and `FileController`.
- [❌] **Update Swagger/OpenAPI documentation** with new endpoints.
- [⚠️] **Remove deprecated code** – *старые классы (`FileMetadata`, `DirectoryMetadata`) больше не используются, но могут оставаться в проекте.*
- [❌] **Update README** with new database setup instructions.

## Future Improvements (Backlog)
- [✅] **Implement folder restore with child synchronization**.
- [❌] **Add automatic cleanup** of old deleted file versions.
- [❌] **Cache permission results** using Spring Cache.
- [❌] **Add WebSocket notifications** for real‑time file updates.
- [❌] **Add endpoint to preview file content** (images, text files) directly in the browser.