package com.example.TraficIntelligence.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
            // PUBLIC
            .requestMatchers("/api/auth/**").permitAll()
            // ADMIN
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            // FLEET MANAGER
            .requestMatchers("/api/fleet/**").hasAnyRole("ADMIN", "FLEET_MANAGER")
            // DRIVER
            .requestMatchers("/api/driver/**").hasRole("DRIVER")
            // CUSTOMER
            .requestMatchers("/api/customer/**").hasRole("CUSTOMER")
            .anyRequest().authenticated());

        return http.build();
    }

}
