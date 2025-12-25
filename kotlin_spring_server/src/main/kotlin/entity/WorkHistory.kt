package org.zak.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "WorkHistory")
class WorkHistory(
	@Column(name = "WorkTime", nullable = false)
	var workTime: LocalDateTime = LocalDateTime.now(),
	
	@Column(name = "Path", nullable = false, length = 4096)
	var path: String,
	
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "IdUser", nullable = false)
	var user: User,
	
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "IdOperationType", nullable = false)
	var operationType: OperationType
) : BaseEntity<Long>()