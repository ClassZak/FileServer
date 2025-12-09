package org.zak.entity

import jakarta.persistence.*

@Entity
@Table(name = "Administrator")
data class Administrator(
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "Id")
	val id: Int? = null,
	
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "IdUser", nullable = false, referencedColumnName = "Id")
	val user: User
)