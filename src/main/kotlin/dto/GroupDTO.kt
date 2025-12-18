package org.zak.dto



import java.time.LocalDateTime

/**
 * DTO для детальной информации о группе.
 * Содержит основную информацию и участников (загружаются сразу или асинхронно)
 */
data class GroupDetailsDto(
	val name: String,
	val membersCount: Int,
	val creator: UserModelResponse,
	val members: List<UserModelResponse> = emptyList()
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