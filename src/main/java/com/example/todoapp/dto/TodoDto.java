package com.example.todoapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TodoDto(
    String id,
    @NotBlank @Size(max = 150) String title,
    @Size(max = 1000) String description,
    boolean completed
) {
}
