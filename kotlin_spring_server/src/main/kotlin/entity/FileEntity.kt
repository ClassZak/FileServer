package org.zak.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "FileEntity")
class FileEntity (
	@Column(name = "Path", nullable = false, unique = true, length = 4096)
	var path: String,
	
	@Column(name = "CreatedAt", nullable = false)
	var createdAt: LocalDateTime = LocalDateTime.now(),
	
	@Column(name = "IsDeleted", nullable = false)
	var isDeleted: Boolean = false
	
) : BaseEntity<Long>()