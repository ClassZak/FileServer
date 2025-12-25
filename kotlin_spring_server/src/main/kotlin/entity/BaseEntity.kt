package org.zak.entity

import jakarta.persistence.*

@MappedSuperclass
abstract class BaseEntity<T> {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	var id: T? = null
	
	override fun equals(other: Any?): Boolean {
		if (this === other) return true
		if (javaClass != other?.javaClass) return false
		
		other as BaseEntity<*>
		return id != null && id == other.id
	}
	
	override fun hashCode() = 31
	override fun toString() = "${javaClass.simpleName}(id=$id)"
}