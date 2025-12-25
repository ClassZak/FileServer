package org.zak.util

import io.jsonwebtoken.*
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.stereotype.Component
import org.zak.dto.CurrentUser
import java.util.*
import javax.crypto.SecretKey

@Component
class JwtUtil(
	@Value("\${jwt.secret}") private val secret: String
) {
	private val secretKey: SecretKey = Keys.hmacShaKeyFor(secret.toByteArray())
	private val tokenExpirationMs = 3600000L // 1 час
	private val refreshTokenExpirationMs = 604800000L // 7 дней
	
	fun generateToken(userDetails: UserDetails): String {
		return generateToken(userDetails, emptyMap())
	}
	
	fun generateToken(userDetails: UserDetails, claims: Map<String, Any>): String {
		val builder = Jwts.builder()
			.setSubject(userDetails.username)
			.claim("authorities", userDetails.authorities)
			.setIssuedAt(Date())
			.setExpiration(Date(System.currentTimeMillis() + tokenExpirationMs))
			.signWith(secretKey, SignatureAlgorithm.HS256)
		
		// Добавляем дополнительные claims
		claims.forEach { (key, value) ->
			builder.claim(key, value)
		}
		
		return builder.compact()
	}
	
	fun generateRefreshToken(userDetails: UserDetails): String {
		return Jwts.builder()
			.setSubject(userDetails.username)
			.setIssuedAt(Date())
			.setExpiration(Date(System.currentTimeMillis() + refreshTokenExpirationMs))
			.signWith(secretKey, SignatureAlgorithm.HS256)
			.compact()
	}
	
	// метод для генерации refresh token с userId
	fun generateRefreshToken(userDetails: UserDetails, userId: Int): String {
		return Jwts.builder()
			.setSubject(userDetails.username)
			.claim("userId", userId)
			.setIssuedAt(Date())
			.setExpiration(Date(System.currentTimeMillis() + refreshTokenExpirationMs))
			.signWith(secretKey, SignatureAlgorithm.HS256)
			.compact()
	}
	
	fun extractUsername(token: String): String {
		return getClaimsFromToken(token).subject
	}
	
	// ✅ Извлечение userId из токена
	fun extractUserId(token: String): Int? {
		return try {
			getClaimsFromToken(token)["userId"]?.toString()?.toInt()
		} catch (e: Exception) {
			null
		}
	}
	
	fun validateToken(token: String): Boolean {
		return try {
			getClaimsFromToken(token)
			true
		} catch (e: Exception) {
			false
		}
	}
	
	fun validateToken(token: String, userDetails: UserDetails): Boolean {
		val username = extractUsername(token)
		return username == userDetails.username && validateToken(token)
	}
	
	private fun getClaimsFromToken(token: String): Claims {
		return Jwts.parserBuilder()
			.setSigningKey(secretKey)
			.build()
			.parseClaimsJws(token)
			.body
	}
	
	fun isTokenExpired(token: String): Boolean {
		return getClaimsFromToken(token).expiration.before(Date())
	}
	
	
	
	fun extractJwtToken(authHeader: String): String {
		return if (authHeader.startsWith("Bearer ")) {
			authHeader.substring(7)
		} else {
			throw IllegalArgumentException("Неверный формат заголовка Authorization")
		}
	}
	
	private fun getCurrentUserEmailFromJwt(jwtToken: String): String {
		if (!validateToken(jwtToken)) {
			throw Exception("Недействительный токен")
		}
		
		return extractUsername(jwtToken)
	}
}