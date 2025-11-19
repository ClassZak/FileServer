package org.zak.filter

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import org.zak.service.UserService
import org.zak.util.JwtUtil
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse

@Component
class JwtRequestFilter(
	private val userService: UserService,
	private val jwtUtil: JwtUtil
) : OncePerRequestFilter() {
	
	override fun doFilterInternal(
		request: HttpServletRequest,
		response: HttpServletResponse,
		chain: FilterChain
	) {
		val authorizationHeader = request.getHeader("Authorization")
		
		var username: String? = null
		var jwt: String? = null
		
		if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
			jwt = authorizationHeader.substring(7)
			username = try {
				jwtUtil.extractUsername(jwt)
			} catch (e: Exception) {
				null
			}
		}
		
		// Также проверяем токен в cookies (для браузерных запросов)
		if (username == null) {
			val cookies = request.cookies
			cookies?.find { it.name == "jwtToken" }?.value?.let { token ->
				jwt = token
				username = try {
					jwtUtil.extractUsername(token)
				} catch (e: Exception) {
					null
				}
			}
		}
		
		if (username != null && SecurityContextHolder.getContext().authentication == null) {
			try {
				val userDetails = userService.loadUserByUsername(username!!)
				
				if (jwtUtil.validateToken(jwt!!, userDetails)) {
					val userId = jwtUtil.extractUserId(jwt!!)
					val authToken = UsernamePasswordAuthenticationToken(
						userDetails, null, userDetails.authorities
					).apply {
						details = mapOf("userId" to userId, "token" to jwt)
					}
					SecurityContextHolder.getContext().authentication = authToken
				}
			} catch (e: Exception) {
				logger.debug("JWT validation failed for user: $username")
			}
		}
		chain.doFilter(request, response)
	}
}