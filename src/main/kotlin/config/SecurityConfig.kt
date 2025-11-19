package org.zak.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.zak.filter.JwtRequestFilter

@Configuration
class SecurityConfig {
	
	@Bean
	fun filterChain(
		http: HttpSecurity,
		jwtRequestFilter: JwtRequestFilter  // Внедряем через параметр метода
	): SecurityFilterChain {
		http
			.csrf { csrf ->
				csrf.disable() // Временно отключаем CSRF для упрощения
			}
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
						"/error"
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