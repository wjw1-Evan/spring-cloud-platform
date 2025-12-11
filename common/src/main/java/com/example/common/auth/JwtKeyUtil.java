package com.example.common.auth;

import javax.crypto.SecretKey;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.WeakKeyException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Utility for deriving SecretKey for HMAC signing/verification from configured secret.
 * Mirrors the behavior used in AuthService.JwtService.
 */
public final class JwtKeyUtil {

    private JwtKeyUtil() {}

    public static SecretKey deriveKey(String secret) {
        byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        SecretKey key;
        try {
            key = Keys.hmacShaKeyFor(secretBytes);
        } catch (IllegalArgumentException | WeakKeyException ex) {
            try {
                MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
                byte[] hashed = sha256.digest(secretBytes);
                key = Keys.hmacShaKeyFor(hashed);
            } catch (NoSuchAlgorithmException e) {
                throw new IllegalStateException("Failed to create JWT key", e);
            }
        }
        return key;
    }
}
