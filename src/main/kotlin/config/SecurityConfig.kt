package org.zak.config

import jakarta.servlet.http.HttpServlet
import jakarta.servlet.http.HttpServletResponse
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import org.zak.filter.JwtRequestFilter
import java.net.URLEncoder

@Configuration
@EnableWebSecurity
class SecurityConfig {
	
	@Bean
	fun corsConfigurationSource(): CorsConfigurationSource {
		val configuration = CorsConfiguration()
		configuration.allowedOrigins = listOf(
			"http://localhost:3000",  // React
			"http://localhost:8080"
		)
		configuration.allowedMethods = listOf("*")
		configuration.allowedHeaders = listOf("*")
		configuration.allowCredentials = true
		
		val source = UrlBasedCorsConfigurationSource()
		source.registerCorsConfiguration("/**", configuration)  // ← ВАЖНО: /**
		return source
	}
	@Bean
	fun filterChain(
		http: HttpSecurity,
		jwtRequestFilter: JwtRequestFilter  // Внедряем через параметр метода
	): SecurityFilterChain {
		http
			.cors { cors ->
				cors.configurationSource(corsConfigurationSource())
			}
			.csrf { csrf -> csrf.disable() }
			.sessionManagement { session ->
				session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
			}
			.authorizeHttpRequests { authz ->
				authz
					// Публичные endpoints
					.requestMatchers(
						"/",
						"/login",
						"/register",
						"/styles/**",
						"/public/**",
						"/scripts/**",
						"/scripts/base_scripts/**",
						"/error",
						"/api/auth/check-auth"
					).permitAll()
					// API endpoints аутентификации
					.requestMatchers("/api/auth/**").permitAll()
					.requestMatchers("/api/public/**").permitAll()
					// Защищенные endpoints
					.requestMatchers("/api/admin/**").hasRole("ADMIN")
					.requestMatchers("/api/users/**").authenticated()
					.requestMatchers("/protected/**").authenticated()
					.anyRequest().authenticated()
			}
			/*
			.exceptionHandling { exceptions ->
				exceptions.authenticationEntryPoint { request, response, authException ->
					// Проверяем, хочет ли клиент JSON
					val acceptsJson = request.getHeader("Accept")?.contains("application/json") == true
					
					if (acceptsJson) {
						// Для JSON запросов - 401 с JSON ответом
						response.status = HttpServletResponse.SC_UNAUTHORIZED
						response.contentType = "application/json"
						response.writer.write("""{"error":"Unauthorized","loginUrl":"/login"}""")
					} else {
						// Для HTML запросов - 302 редирект
						val redirectUrl = "/login?redirect=" +
								URLEncoder.encode(request.requestURI, "UTF-8")
						response.sendRedirect(redirectUrl)
					}
				}
			}*/
			// Отключаем дефолтную форму логина Spring Security
			.formLogin { formLogin ->
				formLogin.disable()
			}
			.httpBasic { httpBasic ->
				httpBasic.disable()
			}
			.logout { logout ->
				logout.disable() // Будем обрабатывать logout в своем контроллере
			}
			.addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter::class.java)
		
		return http.build()
	}
	
	@Bean
	fun authenticationManager(authenticationConfiguration: AuthenticationConfiguration): AuthenticationManager {
		return authenticationConfiguration.authenticationManager
	}
}