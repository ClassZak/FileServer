package org.zak.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "DeletedFile")
class DeletedFile : BaseEntity<Long>() {
	@MapsId
	@OneToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "IdFileMetaData", nullable = false)
	var fileMetadata: FileMetadata? = null
	
	@Column(name = "WorkTime", nullable = false)
	var workTime: LocalDateTime = LocalDateTime.now()
}