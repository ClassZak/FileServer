package org.zak.entity

import jakarta.persistence.*

@Entity
@Table(name = "OperationType")
class OperationType(
	@Column(name = "`Name`", nullable = false, length = 45)
	var name: String
) : BaseEntity<Int>()