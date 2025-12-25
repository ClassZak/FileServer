package org.zak.entity

import jakarta.persistence.*

@Entity
@Table(name = "Administrator")
class Administrator(
	@OneToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "IdUser", nullable = false, unique = true)
	var user: User
) : BaseEntity<Int>()