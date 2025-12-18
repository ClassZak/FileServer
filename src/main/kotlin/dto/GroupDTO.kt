package org.zak.dto



import java.time.LocalDateTime

/**
 * DTO для детальной информации о группе.
 * Содержит основную информацию и участников
 */
data class GroupDetailsDto(
	val name: String,
	val membersCount: Int,
	val creator: UserModelResponse,
	val members: List<UserModelResponse> = emptyList()
)

/**
 * DTO для детальной информации о группе.
 * Содержит основную информацию и участников
 */
data class GroupDetailsDtoAdmin(
	val name: String,
	val membersCount: Int,
	val creator: UserModelAdminResponse,
	val members: List<UserModelAdminResponse> = emptyList()
)



/**
 * DTO для краткой информации о группе.
 * Используется для списков
 */
data class GroupBasicInfoDto(
	val name: String,
	val membersCount: Int,
	val creatorEmail: String
)