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
	private val jwtExpirationInMs: Long = 1000 * 60 * 60 * 10 // 10 часов
	
	fun generateToken(userDetails: UserDetails, userId: Int): String {
		val claims: MutableMap<String, Any> = HashMap()
		claims["userId"] = userId
		return createToken(claims, userDetails.username)
	}
	
	private fun createToken(claims: Map<String, Any>, subject: String): String {
		return Jwts.builder()
			.setClaims(claims)
			.setSubject(subject)
			.setIssuedAt(Date(System.currentTimeMillis()))
			.setExpiration(Date(System.currentTimeMillis() + jwtExpirationInMs))
			.signWith(secretKey)
			.compact()
	}
	
	fun extractUsername(token: String): String {
		return extractAllClaims(token).subject
	}
	
	fun extractUserId(token: String): Int {
		return extractAllClaims(token).get("userId", Int::class.java)
	}
	
	fun extractExpiration(token: String): Date {
		return extractAllClaims(token).expiration
	}
	
	private fun extractAllClaims(token: String): Claims {
		return Jwts.parserBuilder()
			.setSigningKey(secretKey)
			.build()
			.parseClaimsJws(token)
			.body
	}
	
	fun validateToken(token: String, userDetails: UserDetails): Boolean {
		val username = extractUsername(token)
		return (username == userDetails.username && !isTokenExpired(token))
	}
	
	private fun isTokenExpired(token: String): Boolean {
		return extractExpiration(token).before(Date())
	}
}