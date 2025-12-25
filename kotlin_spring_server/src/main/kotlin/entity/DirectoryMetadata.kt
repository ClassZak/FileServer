package org.zak.entity

import jakarta.persistence.*

@Entity
@Table(name = "DirectoryMetadata")
class DirectoryMetadata(
	@Column(name = "`Path`", nullable = false, length = 4096)
	var path: String,
	
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "IdUser")
	var user: User? = null,
	
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "IdGroup")
	var group: Group? = null,
	
	@Column(name = "`Mode`", nullable = false)
	var mode: Int
) : BaseEntity<Long>() {
	
	init {
		require(user != null || group != null) {
			"DirectoryMetadata must be associated with either a User or a Group"
		}
	}
}