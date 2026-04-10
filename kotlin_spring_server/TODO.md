# Backend TODO

## Phase 1: Database Redesign & Migration
- [ ] **Design new schema** (see DDL above) and review with team.
- [ ] **Create Flyway/Liquibase migration scripts**:
	- [ ] V2__create_file_folder_entities.sql
	- [ ] V3__create_permission_tables.sql
	- [ ] V4__create_deleted_version_tables.sql
	- [ ] V5__migrate_data_from_old_tables.sql
	- [ ] V6__drop_old_metadata_tables.sql
- [ ] **Write data migration script** with validation steps.
- [ ] **Test migration on a copy of production database**.

## Phase 2: Core Services Refactoring
- [ ] **Create new JPA entities**: `FileEntity`, `FolderEntity`, `FilePermission`, `FolderPermission`, `DeletedFile`, `DeletedFolder`.
- [ ] **Rewrite `FileSystemService`**:
	- [ ] Replace `FileMetadataRepository` with `FileEntityRepository` and `FilePermissionRepository`.
	- [ ] Replace `DirectoryMetadataRepository` with `FolderEntityRepository` and `FolderPermissionRepository`.
	- [ ] Update permission checking logic to use new tables and inheritance.
	- [ ] Modify delete methods to create `DeletedFile`/`DeletedFolder` with versioning.
	- [ ] Implement `restoreFile` and `restoreFolder` using entity IDs.
- [ ] **Update `WorkHistory` recording** in all relevant service methods.

## Phase 3: API Enhancements
- [ ] **Permissions API**:
	- [ ] `GET /api/permissions/folders` – list folder permissions with filters.
	- [ ] `GET /api/permissions/files` – list file permissions with filters.
	- [ ] `PUT /api/permissions/folder` – add/update folder permission.
	- [ ] `DELETE /api/permissions/folder/{id}` – remove folder permission.
	- [ ] (Same for files)
- [ ] **Deleted files API**:
	- [ ] `GET /api/files/deleted` – supports `?userId=`, `?groupId=`, `?pathPrefix=`.
	- [ ] `POST /api/files/restore/{deletedFileId}` – restore specific version.
	- [ ] `GET /api/files/deleted/versions/{fileId}` – list all deleted versions of a file.
- [ ] **Work history API**:
	- [ ] `GET /api/history` – with filters (`userId`, `groupId`, `operationType`, `from`, `to`, `pathPrefix`).

## Phase 4: Testing & Validation
- [ ] **Unit tests** for all new repositories and service methods.
- [ ] **Integration tests** for file operations with new schema.
- [ ] **Performance testing** for permission checks with many records.
- [ ] **Verify data integrity** after migration (spot checks).

## Phase 5: Documentation & Cleanup
- [ ] **Update Swagger/OpenAPI** documentation.
- [ ] **Remove deprecated code** (old services, repositories).

## Future Improvements
- [ ] **Implement folder restore** with full hierarchy reconstruction.
- [ ] **Cache permission results** with Redis or in-memory cache.
- [ ] **Add WebSocket notifications** for file changes.