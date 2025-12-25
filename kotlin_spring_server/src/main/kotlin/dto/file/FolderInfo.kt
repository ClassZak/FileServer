package org.zak.dto.file

import com.fasterxml.jackson.annotation.JsonFormat
import java.util.*

data class FolderInfo(
	val name: String,
	val fullPath: String,
	@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
	val lastModified: Date,
	val size: Long,
	val readableSize: String,
	val itemCount: Int,
	val isDirectory: Boolean = true
)