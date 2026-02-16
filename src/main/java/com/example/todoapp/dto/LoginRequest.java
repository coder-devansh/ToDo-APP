package com.example.todoapp.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
    @NotBlank @JsonAlias({"username", "email"}) String usernameOrEmail,
    @NotBlank String password
) {
}
