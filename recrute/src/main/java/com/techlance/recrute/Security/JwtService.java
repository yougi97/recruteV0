package com.techlance.recrute.Security;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration-ms}")
    private long expirationMs;

    private SecretKey key() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(Long userId, String userType, String email) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("userType", userType)
                .claim("email", email)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key())
                .compact();
    }

    public AuthenticatedUser parseToken(String token) throws JwtException {
        Claims claims = Jwts.parser()
                .verifyWith(key())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        Long userId = Long.parseLong(claims.getSubject());
        String userType = claims.get("userType", String.class);
        String email = claims.get("email", String.class);
        return new AuthenticatedUser(userId, userType, email);
    }
}
