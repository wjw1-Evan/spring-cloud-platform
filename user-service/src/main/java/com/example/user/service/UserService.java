package com.example.user.service;

import com.example.common.api.ApiResponse;
import com.example.user.model.UserAccount;
import com.example.user.repository.UserAccountRepository;
import com.example.user.web.dto.CreateUserRequest;
import com.example.user.web.dto.UserResponse;
import jakarta.validation.Valid;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import java.security.Principal;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Validated
public class UserService {
    private final UserAccountRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserAccountRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public ApiResponse<List<UserResponse>> listUsers() {
        List<UserResponse> users = userRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ApiResponse.ok(users);
    }

    public ApiResponse<UserResponse> create(@Valid CreateUserRequest request) {
        userRepository.findByEmail(request.email()).ifPresent(u -> {
            throw new IllegalArgumentException("Email already exists");
        });
        UserAccount user = UserAccount.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .roles(request.roles() == null || request.roles().isEmpty() ? Set.of("USER") : request.roles())
                .enabled(true)
                .build();
        user = userRepository.save(user);
        return ApiResponse.ok(toResponse(user));
    }

    public ApiResponse<UserResponse> me(Principal principal) {
        String userId = principal.getName();
        UserAccount user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return ApiResponse.ok(toResponse(user));
    }

    private UserResponse toResponse(UserAccount user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getRoles(), user.isEnabled(), user.getCreatedAt());
    }
}
