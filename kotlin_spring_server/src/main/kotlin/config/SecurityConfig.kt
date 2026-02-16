package org.zak.config

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

@Configuration
@EnableWebSecurity
class SecurityConfig {
	
	@Bean
	fun corsConfigurationSource(): CorsConfigurationSource {
		val configuration = CorsConfiguration()
		configuration.allowedOrigins = listOf(
			"http://localhost:3000",  // React app
			"http://localhost:4200",  // Angular app
			"http://localhost:8080"
		)
		configuration.allowedMethods = listOf("*")
		configuration.allowedHeaders = listOf("*")
		configuration.allowCredentials = true
		
		val source = UrlBasedCorsConfigurationSource()
		source.registerCorsConfiguration("/**", configuration)
		return source
	}
	
	@Bean
	fun filterChain(
		http: HttpSecurity,
		jwtRequestFilter: JwtRequestFilter
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
					// Статические ресурсы Angular
					.requestMatchers(
						"/",
						"/index.html",
						"/favicon.ico",
						"/*.js",
						"/*.css",
						"/assets/**"
					).permitAll()
					// Публичные API (не требуют токена)
					.requestMatchers("/api/auth/**", "/api/public/**").permitAll()
					// Все остальные API требуют аутентификации
					.requestMatchers("/api/**").authenticated()
					// Все остальные пути (например, маршруты Angular) разрешены
					.anyRequest().permitAll()
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