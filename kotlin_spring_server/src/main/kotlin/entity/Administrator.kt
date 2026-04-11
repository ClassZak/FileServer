package org.zak.entity

import jakarta.persistence.*

@Entity
@Table(name = "Administrator")
class Administrator(
	@OneToOne(fetch = FetchType.LAZY, optional = false)
	@MapsId
	@JoinColumn(name = "Id")
	var user: User
) : BaseEntity<Int>()