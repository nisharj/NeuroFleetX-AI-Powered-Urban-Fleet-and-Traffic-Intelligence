package com.example.TraficIntelligence.util;

import java.util.Date;

import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;
// import org.springframework.stereotype.Component;

import com.example.TraficIntelligence.model.Role;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.security.Key;

@Component
public class JwtUtil {

    private final Key key;
    private final long expiration;

    public JwtUtil(
        @Value("${jwt.secret}") String secret,
        @Value("${jwt.expiration}") long expiration){
            this.key = Keys.hmacShaKeyFor(secret.getBytes());
            this.expiration = expiration;
        }

    public String generateToken(String email, Role role) {
        return Jwts.builder()
            .setSubject(email)
            .claim("role", role.name())
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + expiration)) 
            .signWith(key, SignatureAlgorithm.HS256)
            .compact();
    }

    public Claims extractClaims(String token) {
        return Jwts.parserBuilder()
            .setSigningKey(key)
            .build()
            .parseClaimsJws(token)
            .getBody();
    }
}
