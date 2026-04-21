# TODO.md (Backend)

## Database & Migration (Phase 1)
- [✅] **Execute new DDL script** to create tables `FileEntity`, `FolderEntity`, `FilePermission`, `FolderPermission`, `DeletedFile`, `DeletedFolder`, `OperationType`, `WorkHistory` (with `Path`, `IsFile`, `Details`).
- [✅] **Add initial `OperationType` records**: `'CREATE'`, `'READ'`, `'UPDATE'`, `'DELETE'`, `'RESTORE'`, `'CHANGE_PERMISSIONS'`, `'MOVE'`, `'RENAME'`, `'DOWNLOAD'`, `'UPLOAD'`.
- [✅] **Drop old tables** (`FileMetadata`, `DirectoryMetadata`, old `DeletedFile`, old `WorkHistory`) – *выполнено путём удаления всей БД, так как реальных данных не было*.
- [✅] **Update `application.properties`** with new database name `FileServer1` and connection settings.

## Core JPA Entities (Phase 2)
- [✅] **Create new Kotlin entity classes** matching the new schema:
	- `FileEntity.kt` (`id`, `path`, `createdAt`, `isDeleted`)
	- `FolderEntity.kt` (`id`, `path`, `createdAt`, `isDeleted`)
	- `FilePermission.kt` (`id`, `fileEntity`, `user`, `group`, `mode`)
	- `FolderPermission.kt` (`id`, `folderEntity`, `user`, `group`, `mode`)
	- `DeletedFile.kt` (`id`, `fileEntity`, `originalPath`, `deletedByUser`, `deletedAt`, `version`)
	- `DeletedFolder.kt` (`id`, `folderEntity`, `originalPath`, `deletedByUser`, `deletedAt`, `version`)
	- `OperationType.kt` (already exists, but ensure it matches new table)
	- `WorkHistory.kt` (update fields: `workTime`, `operationType`, `user`, `fileEntity`, `folderEntity`, `path`, `isFile`, `details`)
- [✅] **Update relationships** in `User`, `Group`, `Administrator` to remove old mappings (`fileMetadata`, `directoryMetadata`) and add new ones (`fileEntities`, `folderEntities`, `filePermissions`, etc.) as needed.

## Repository Layer (Phase 3)
- [✅] **Create/update repository interfaces**:
	- `FileEntityRepository` (extends `JpaRepository`)
	- `FolderEntityRepository`
	- `FilePermissionRepository`
	- `FolderPermissionRepository`
	- `DeletedFileRepository` (new methods: `findByFileEntityIdOrderByVersionDesc`, `findByDeletedByUserId`, etc.)
	- `DeletedFolderRepository`
	- `WorkHistoryRepository` (update queries to use `path`, `isFile`, `details`)
- [✅] **Add custom query methods** for permission checking (e.g., finding all permissions for a path prefix).

## Service Layer Refactoring (Phase 4) – Critical
- [✅] **Rewrite `FileSystemService`** to use new entities and repositories:
	- [✅] Replace `fileMetadataRepository`/`directoryMetadataRepository` with `FileEntityRepository`/`FolderEntityRepository` and permission repositories.
	- [✅] **Permission checking logic**: implement `checkAccessForDirectory`/`checkAccessForFile` using `FolderPermission` and `FilePermission` (with path prefix search and inheritance).
	- [✅] **Create/update methods**:
		- `uploadFile` → create `FileEntity` and optionally `FilePermission`.
		- `createFolder` → create `FolderEntity` and optionally `FolderPermission`.
		- `deleteByPermissionsAndSaveCopy` → set `isDeleted=true`, create `DeletedFile`/`DeletedFolder` record, move file physically.
		- `restoreFile` → use `DeletedFile` to restore; set `isDeleted=false`, delete `DeletedFile` record.
	- [✅] **Work history recording**: insert `WorkHistory` records on every significant operation (create, delete, restore, change permissions, move, download).
	- [✅] **Group folder management**: `createGroupFolder`, `deleteGroupFolder`, `moveGroupFolder` – update to work with `FolderEntity` and permission logic.
- [✅] **Refactor `GroupService` and `UserService`** to remove dependencies on old metadata entities.
- [✅] **Create new service methods for permission management**:
	- `setFilePermission(path, userId?, groupId?, mode)`
	- `setFolderPermission(path, userId?, groupId?, mode)`
	- `deleteFilePermission(permissionId)`
	- `deleteFolderPermission(permissionId)`
- [✅] **Create service methods for history and deleted items retrieval**:
	- `getDeletedFiles(userId, isAdmin, filters)`
	- `getDeletedFolders(...)`
	- `getWorkHistory(filters)`

## API Endpoints (Phase 5)
- [✅] **Update existing file endpoints** to use new service methods (no breaking changes expected from client perspective).
- [✅] **Add new endpoints in `FileController`**:
	- `GET /api/files/deleted/files` – list deleted files.
	- `GET /api/files/deleted/folders` – list deleted folders.
	- `POST /api/files/restore/file/{id}` – restore a specific deleted file version.
	- `POST /api/files/restore/folder/{id}` – restore a specific deleted folder version.
	- `GET /api/files/deleted/file/versions/` – list all deleted versions of a file (by `path` and `filename`).
	- `GET /api/files/deleted/folders/versions/` – list all deleted versions of a folder (by `path`).
- [✅] **Add permission management endpoints** (admin only):
	- `PUT /api/files/permissions/folder` – set/update folder permission.
	- `DELETE /api/files/permissions/folder/{id}` – delete folder permission.
	- `PUT /api/files/permissions/file` – set/update file permission.
	- `DELETE /api/files/permissions/file/{id}` – delete file permission.
- [✅] **Add history endpoint**:
	- `GET /api/files/history` – retrieve work history with filters (`?userId=`, `?pathPrefix=`, `?isFile=`).

## Security & Access Control (Phase 6)
- [✅] **Implement permission inheritance** logic in `checkAccessForDirectory`/`checkAccessForFile`:
	- Traverse path components upwards, collect permissions from `FolderPermission` tables.
	- For group folders (`groups/<groupName>`), default to `ALL` for members, `NONE` otherwise.
- [✅] **Restrict non-admin users** from viewing other users' deleted files/history unless they share group access.
- [✅] **Add `@PreAuthorize` checks** for admin-only endpoints (permission management, viewing all history).
- [❌] **Replace numeric IDs with path-based identifiers for trash operations**: Modify `restoreFile`, `restoreFolder`, `permanentDeleteFile`, `permanentDeleteFolder` to accept `originalPath` and `version` instead of `deletedId`. This prevents predictable numeric IDs in URLs/requests.

## Testing (Phase 7)
- [✅] **Update existing unit tests** (`FileSystemServiceTest`) to mock new repositories.
- [❌] **Write integration tests** for new permission and history endpoints.
- [❌] **Test data migration** script (if any old data needs to be preserved). *(Не требуется)*

## Documentation & Cleanup (Phase 8)
- [❌] **Update Swagger/OpenAPI documentation** with new endpoints.
- [⚠️] **Remove deprecated code** (old entities, repositories, services). *(Checking is needed – old code may still exist in project but is unused)*
- [❌] **Update README** with new database setup instructions.

## Future Improvements (Backlog)
- [✅] **Implement folder restore** (already done).
- [❌] **Add automatic cleanup** of old deleted file versions (e.g., keep last 5 versions).
- [❌] **Cache permission results** using Spring Cache.
- [❌] **Add WebSocket notifications** for real-time file updates.