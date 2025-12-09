package com.example.auth.service;

import com.example.auth.model.RefreshToken;
import com.example.auth.model.UserAccount;
import com.example.auth.repository.RefreshTokenRepository;
import com.example.auth.repository.UserAccountRepository;
import com.example.auth.web.dto.LoginRequest;
import com.example.auth.web.dto.RegisterRequest;
import com.example.auth.web.dto.TokenResponse;
import com.example.common.api.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import java.time.Instant;
import java.util.List;
import java.util.Set;

@Service
@Validated
public class AuthService {

    private final UserAccountRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserAccountRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public ApiResponse<TokenResponse> register(@Valid RegisterRequest request) {
        userRepository.findByEmail(request.email()).ifPresent(user -> {
            throw new IllegalArgumentException("Email already exists");
        });
        UserAccount user = UserAccount.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .roles(Set.of("USER"))
                .build();
        user = userRepository.save(user);
        return login(new LoginRequest(request.email(), request.password()));
    }

    public ApiResponse<TokenResponse> login(@Valid LoginRequest request) {
        UserAccount user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid credentials");
        }
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), List.copyOf(user.getRoles()));
        refreshTokenRepository.deleteByUserId(user.getId());
        String refreshTokenStr = jwtService.generateRefreshToken(user.getId());
        RefreshToken refreshToken = RefreshToken.builder()
                .token(refreshTokenStr)
                .userId(user.getId())
                .expiresAt(Instant.now().plusSeconds(jwtService.getProperties().getRefreshExpiration()))
                .build();
        refreshTokenRepository.save(refreshToken);
        return ApiResponse.ok(new TokenResponse(accessToken, refreshTokenStr, user.getId(), user.getEmail(), List.copyOf(user.getRoles())));
    }

    public ApiResponse<TokenResponse> refresh(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));
        if (refreshToken.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Refresh token expired");
        }
        UserAccount user = userRepository.findById(refreshToken.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), List.copyOf(user.getRoles()));
        return ApiResponse.ok(new TokenResponse(accessToken, token, user.getId(), user.getEmail(), List.copyOf(user.getRoles())));
    }
}
