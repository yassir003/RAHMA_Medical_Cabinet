package com.cabinet.medical.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {

    @Value("${cors.allowed-origins}")
    private String allowedOrigins;

    /**
     * Single source of truth for CORS policy.
     *
     * Spring Security picks this up via
     * {@code http.cors(c -> c.configurationSource(corsConfigurationSource))}
     * in {@link SecurityConfig}, which means the CORS check — including OPTIONS
     * pre-flight handling — happens *inside* the security filter chain, before
     * any authentication logic runs.
     *
     * No separate {@code CorsFilter} bean is needed: a standalone
     * {@code CorsFilter} registered outside the security chain would run at a
     * lower priority than the {@code SecurityFilterChain} and would therefore
     * never see the preflight request.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(allowedOrigins));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
