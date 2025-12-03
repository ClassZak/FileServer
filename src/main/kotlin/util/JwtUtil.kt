package org.zak.util

import io.jsonwebtoken.*
import io.jsonwebtoken.security.Keys
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.stereotype.Component
import java.util.*
import javax.crypto.SecretKey


@Component
class JwtUtil {
	private val secretKey: SecretKey = Keys.secretKeyFor(SignatureAlgorithm.HS256)
	private val accessTokenExpiration: Long = 1000 * 60 * 60 * 10 // 10 часов
	private val refreshTokenExpiration: Long = 1000 * 60 * 60 * 24 * 7 // 7 дней
	
	fun generateToken(userDetails: UserDetails, userId: Int): String {
		val claims: Map<String, Any> = mapOf("userId" to userId)
		return createToken(claims, userDetails.username, accessTokenExpiration)
	}
	
	fun generateRefreshToken(userDetails: UserDetails, userId: Int): String {
		val claims: Map<String, Any> = mapOf(
			"userId" to userId,
			"tokenType" to "refresh"
		)
		return createToken(claims, userDetails.username, refreshTokenExpiration)
	}
	
	private fun createToken(claims: Map<String, Any>, subject: String, expiration: Long): String {
		return Jwts.builder()
			.setClaims(claims)
			.setSubject(subject)
			.setIssuedAt(Date(System.currentTimeMillis()))
			.setExpiration(Date(System.currentTimeMillis() + expiration))
			.signWith(secretKey)
			.compact()
	}
	
	fun extractUsername(token: String): String {
		return extractAllClaims(token).subject
	}
	
	fun extractUserId(token: String): Int {
		return extractAllClaims(token).get("userId", Int::class.java)
	}
	
	private fun extractAllClaims(token: String): Claims {
		return try {
			Jwts.parserBuilder()
				.setSigningKey(secretKey)
				.build()
				.parseClaimsJws(token)
				.body
		} catch (e: JwtException) {
			throw JwtException("Invalid JWT token", e)
		}
	}
	
	fun validateToken(token: String, userDetails: UserDetails): Boolean {
		return try {
			val username = extractUsername(token)
			username == userDetails.username && !isTokenExpired(token)
		} catch (e: JwtException) {
			false
		}
	}
	
	private fun isTokenExpired(token: String): Boolean {
		return extractAllClaims(token).expiration.before(Date())
	}
}