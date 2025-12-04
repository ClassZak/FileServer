package org.zak.dto.file

data class FileSystemResponse(
	val path: String,
	val parentPath: String?,
	val files: List<FileInfo> = emptyList(),
	val folders: List<FolderInfo> = emptyList(),
	val totalFiles: Int = 0,
	val totalFolders: Int = 0,
	val totalSize: String,
	val permissions: Permissions = Permissions()
) {
	data class Permissions(
		val canUpload: Boolean = true,
		val canCreateFolder: Boolean = true,
		val canDelete: Boolean = true,
		val canDownload: Boolean = true
	)
}