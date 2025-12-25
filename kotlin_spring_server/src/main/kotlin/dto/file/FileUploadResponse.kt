package org.zak.dto.file

data class FileUploadResponse(
	val success: Boolean,
	val message: String,
	val file: FileInfo? = null,
	val errors: List<String> = emptyList()
)

data class CreateFolderRequest(
	val path: String,
	val folderName: String
)

data class DeleteRequest(
	val path: String
)

data class DownloadRequest(
	val path: String
)