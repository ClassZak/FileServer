# TODO.md

## Database & Migration (Phase 1)
- [ ] **Execute new DDL script** to create tables `FileEntity`, `FolderEntity`, `FilePermission`, `FolderPermission`, `DeletedFile`, `DeletedFolder`, `OperationType`, `WorkHistory` (with `Path`, `IsFile`, `Details`).
- [ ] **Add initial `OperationType` records**: `'CREATE'`, `'READ'`, `'UPDATE'`, `'DELETE'`, `'RESTORE'`, `'CHANGE_PERMISSIONS'`, `'MOVE'`, `'RENAME'`, `'DOWNLOAD'`, `'UPLOAD'`.
- [ ] **Drop old tables** (`FileMetadata`, `DirectoryMetadata`, old `DeletedFile`, old `WorkHistory`) **after** data migration (if any existing data needs preservation).
- [ ] **Update `application.properties`** with new database name `FileServer1` and connection settings.

## Core JPA Entities (Phase 2)
- [ ] **Create new Kotlin entity classes** matching the new schema:
	- `FileEntity.kt` (`id`, `path`, `createdAt`, `isDeleted`)
	- `FolderEntity.kt` (`id`, `path`, `createdAt`, `isDeleted`)
	- `FilePermission.kt` (`id`, `fileEntity`, `user`, `group`, `mode`)
	- `FolderPermission.kt` (`id`, `folderEntity`, `user`, `group`, `mode`)
	- `DeletedFile.kt` (`id`, `fileEntity`, `originalPath`, `deletedByUser`, `deletedAt`, `version`)
	- `DeletedFolder.kt` (`id`, `folderEntity`, `originalPath`, `deletedByUser`, `deletedAt`, `version`)
	- `OperationType.kt` (already exists, but ensure it matches new table)
	- `WorkHistory.kt` (update fields: `workTime`, `operationType`, `user`, `fileEntity`, `folderEntity`, `path`, `isFile`, `details`)
- [ ] **Update relationships** in `User`, `Group`, `Administrator` to remove old mappings (`fileMetadata`, `directoryMetadata`) and add new ones (`fileEntities`, `folderEntities`, `filePermissions`, etc.) as needed.

## Repository Layer (Phase 3)
- [ ] **Create/update repository interfaces**:
	- `FileEntityRepository` (extends `JpaRepository`)
	- `FolderEntityRepository`
	- `FilePermissionRepository`
	- `FolderPermissionRepository`
	- `DeletedFileRepository` (new methods: `findByFileEntityIdOrderByVersionDesc`, `findByDeletedByUserId`, etc.)
	- `DeletedFolderRepository`
	- `WorkHistoryRepository` (update queries to use `path`, `isFile`, `details`)
- [ ] **Add custom query methods** for permission checking (e.g., finding all permissions for a path prefix).

## Service Layer Refactoring (Phase 4) – Critical
- [ ] **Rewrite `FileSystemService`** to use new entities and repositories:
	- [ ] Replace `fileMetadataRepository`/`directoryMetadataRepository` with `FileEntityRepository`/`FolderEntityRepository` and permission repositories.
	- [ ] **Permission checking logic**: implement `checkAccessForDirectory`/`checkAccessForFile` using `FolderPermission` and `FilePermission` (with path prefix search and inheritance).
	- [ ] **Create/update methods**:
		- `uploadFile` → create `FileEntity` and optionally `FilePermission`.
		- `createFolder` → create `FolderEntity` and optionally `FolderPermission`.
		- `deleteByPermissionsAndSaveCopy` → set `isDeleted=true`, create `DeletedFile`/`DeletedFolder` record, move file physically.
		- `restoreFile` → use `DeletedFile` to restore; set `isDeleted=false`, delete `DeletedFile` record.
	- [ ] **Work history recording**: insert `WorkHistory` records on every significant operation (create, delete, restore, change permissions, move, download).
	- [ ] **Group folder management**: `createGroupFolder`, `deleteGroupFolder`, `moveGroupFolder` – update to work with `FolderEntity` and permission logic.
- [ ] **Refactor `GroupService` and `UserService`** to remove dependencies on old metadata entities.
- [ ] **Create new service methods for permission management**:
	- `setFilePermission(path, userId?, groupId?, mode)`
	- `setFolderPermission(path, userId?, groupId?, mode)`
	- `deleteFilePermission(permissionId)`
	- `deleteFolderPermission(permissionId)`
- [ ] **Create service methods for history and deleted items retrieval**:
	- `getDeletedFiles(userId, isAdmin, filters)`
	- `getDeletedFolders(...)`
	- `getWorkHistory(filters)`

## API Endpoints (Phase 5)
- [ ] **Update existing file endpoints** to use new service methods (no breaking changes expected from client perspective).
- [ ] **Add new endpoints in `FileController`**:
	- `GET /api/files/deleted` – list deleted files (with query params: `?type=file|folder`, `?userId=`, `?groupId=`, `?pathPrefix=`).
	- `POST /api/files/restore/{deletedFileId}` – restore a specific deleted file version.
	- `GET /api/files/deleted/versions/{fileId}` – list all deleted versions of a file.
- [ ] **Add permission management endpoints** (admin only):
	- `GET /api/permissions/folders` – list folder permissions (filters by path, user, group).
	- `GET /api/permissions/files` – list file permissions.
	- `PUT /api/permissions/folder` – set/update folder permission.
	- `DELETE /api/permissions/folder/{id}` – delete folder permission.
	- (Same for `/api/permissions/file`)
- [ ] **Add history endpoint**:
	- `GET /api/history` – retrieve work history with filters (`?userId=`, `?groupId=`, `?operationType=`, `?from=`, `?to=`, `?pathPrefix=`).

## Security & Access Control (Phase 6)
- [ ] **Implement permission inheritance** logic in `checkAccessForDirectory`/`checkAccessForFile`:
	- Traverse path components upwards, collect permissions from `FolderPermission` tables.
	- For group folders (`groups/<groupName>`), default to `ALL` for members, `NONE` otherwise.
- [ ] **Restrict non-admin users** from viewing other users' deleted files/history unless they share group access.
- [ ] **Add `@PreAuthorize` checks** for admin-only endpoints (permission management, viewing all history).

## Testing (Phase 7)
- [ ] **Update existing unit tests** (`FileSystemServiceTest`) to mock new repositories.
- [ ] **Write integration tests** for new permission and history endpoints.
- [ ] **Test data migration** script (if any old data needs to be preserved).

## Documentation & Cleanup (Phase 8)
- [ ] **Update Swagger/OpenAPI documentation** with new endpoints.
- [ ] **Remove deprecated code** (old entities, repositories, services).
- [ ] **Update README** with new database setup instructions.

## Future Improvements (Backlog)
- [ ] **Implement folder restore** (currently only file restore is planned).
- [ ] **Add automatic cleanup** of old deleted file versions (e.g., keep last 5 versions).
- [ ] **Cache permission results** using Spring Cache.
- [ ] **Add WebSocket notifications** for real-time file updates.