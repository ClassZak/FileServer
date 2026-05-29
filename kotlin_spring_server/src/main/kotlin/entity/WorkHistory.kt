package org.zak.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "WorkHistory")
class WorkHistory(
	@Column(name = "WorkTime", nullable = false)
	var workTime: LocalDateTime = LocalDateTime.now(),
	
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "IdOperationType", nullable = false)
	var operationType: OperationType,
	
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "IdUser", nullable = false)
	var user: User,
	
	@ManyToOne(fetch = FetchType.LAZY, optional = true)
	@JoinColumn(name = "IdFileEntity", nullable = true)
	var fileEntity: FileEntity?,
	
	@ManyToOne(fetch = FetchType.LAZY, optional = true)
	@JoinColumn(name = "IdFolderEntity", nullable = true)
	var folderEntity: FolderEntity?,
	
	@Column(name = "Path", nullable = false, length = 4096)
	var path: String,
	
	@Column(name = "IsFile", nullable = false)
	var isFile: Boolean = true,
	
	@Lob
	@Column(name = "Details", nullable = true, length = 65535)
	var details: String? = null,
	
) : BaseEntity<Long>()