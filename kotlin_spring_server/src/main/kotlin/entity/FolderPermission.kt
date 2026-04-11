package org.zak.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "FolderPermission")
class FolderPermission (
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "IdFolderEntity", nullable = false)
	var folderEntity: FolderEntity,
	
	@ManyToOne(fetch = FetchType.LAZY, optional = true)
	@JoinColumn(name = "IdUser", nullable = true)
	var user: User?,
	
	@ManyToOne(fetch = FetchType.LAZY, optional = true)
	@JoinColumn(name = "IdGroup", nullable = true)
	var group: Group?,
	
	@Column(name = "Mode")
	var mode: Short

) : BaseEntity<Long>()