package org.zak.entity

import jakarta.persistence.*

@Entity
@Table(name = "`Group`")
class Group(
	@Column(name = "`Name`", nullable = false, length = 64, unique = true)
	var name: String,
	
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "IdCreator", nullable = false)
	var creator: User,
	
	@ManyToMany
	@JoinTable(
		name = "GroupMember",
		joinColumns = [JoinColumn(name = "IdGroup")],
		inverseJoinColumns = [JoinColumn(name = "IdUser")]
	)
	val members: MutableSet<User> = mutableSetOf()
) : BaseEntity<Int>()