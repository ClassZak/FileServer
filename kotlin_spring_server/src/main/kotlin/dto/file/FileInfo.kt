package org.zak.dto.file

import com.fasterxml.jackson.annotation.JsonFormat
import java.util.*

data class FileInfo(
	val name: String,
	val fullPath: String,
	@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
	val lastModified: Date,
	val size: Long,
	val extension: String,
	val readableSize: String,
	val isDirectory: Boolean = false
)