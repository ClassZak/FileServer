package org.zak.entity

import jakarta.persistence.*
import java.time.LocalDateTime
@Entity
@Table(name = "DeletedFolder")
class DeletedFolder (
	@ManyToOne(fetch = FetchType.LAZY, optional = true)
	@JoinColumn(name = "IdFolderEntity", nullable = false)
	var folderEntity: FolderEntity,
	
	@Column(name = "OriginalPath", nullable = false, length = 4096)
	var originalPath: String,
	
	@ManyToOne(fetch = FetchType.LAZY, optional = true)
	@JoinColumn(name = "IdDeletedByUser", nullable = false)
	var deletedByUser: User,
	
	@Column(name = "DeletedAt", nullable = false)
	var deletedAt: LocalDateTime = LocalDateTime.now(),
	
	@Column(name = "Version", nullable = false)
	var version: Int = 1,
	) : BaseEntity<Long>()