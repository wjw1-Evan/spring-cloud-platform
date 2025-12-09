package com.example.auth.web.dto;

import java.util.List;

public record TokenResponse(String accessToken, String refreshToken, String userId, String email, List<String> roles) {
}
