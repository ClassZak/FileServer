package org.zak.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "`User`")
data class User(
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "Id")
	var id: Int? = null,
	
	@Column(name = "Name", nullable = false, length = 45)
	var name: String,
	
	@Column(name = "Surname", nullable = false, length = 45)
	var surname: String,
	
	@Column(name = "Patronymic", nullable = false, length = 45)
	var patronymic: String,
	
	@Column(name = "Email", nullable = false, length = 60, unique = true)
	var email: String,
	
	@Column(name = "PasswordHash", nullable = false, length = 60)
	var passwordHash: String,
	
	@Column(name = "CreatedAt", nullable = false)
	var createdAt: LocalDateTime = LocalDateTime.now()
)