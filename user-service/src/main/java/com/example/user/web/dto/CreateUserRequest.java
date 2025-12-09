package com.example.user.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record CreateUserRequest(@Email @NotBlank String email,
                                @NotBlank @Size(min = 6) String password,
                                Set<String> roles) {
}
