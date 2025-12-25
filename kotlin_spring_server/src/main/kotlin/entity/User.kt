package org.zak.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "`User`")
class User(
	@Column(name = "Surname", nullable = false, length = 45)
	var surname: String,
	
	@Column(name = "`Name`", nullable = false, length = 45)
	var name: String,
	
	@Column(name = "Patronymic", nullable = false, length = 45)
	var patronymic: String,
	
	@Column(name = "Email", nullable = false, length = 60, unique = true)
	var email: String,
	
	@Column(name = "PasswordHash", nullable = false, length = 60)
	var passwordHash: String,
	
	@Column(name = "CreatedAt", nullable = false)
	var createdAt: LocalDateTime = LocalDateTime.now()
) : BaseEntity<Int>() {
	
	@OneToOne(mappedBy = "user", cascade = [CascadeType.ALL], orphanRemoval = true)
	var administrator: Administrator? = null
	
	@OneToMany(mappedBy = "creator", fetch = FetchType.LAZY)
	val createdGroups: MutableSet<Group> = mutableSetOf()
	
	@ManyToMany(mappedBy = "members")
	val groups: MutableSet<Group> = mutableSetOf()
	
	@OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
	val fileMetadata: MutableSet<FileMetadata> = mutableSetOf()
	
	@OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
	val directoryMetadata: MutableSet<DirectoryMetadata> = mutableSetOf()
}