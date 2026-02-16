package com.example.todoapp.controller;

import com.example.todoapp.dto.TodoDto;
import com.example.todoapp.service.TodoService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/todos")
public class TodoController {

    private final TodoService todoService;

    public TodoController(TodoService todoService) {
        this.todoService = todoService;
    }

    @GetMapping
    public ResponseEntity<List<TodoDto>> getTodos(Authentication authentication) {
        return ResponseEntity.ok(todoService.getTodosForCurrentUser(authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<TodoDto> createTodo(Authentication authentication, @Valid @RequestBody TodoDto request) {
        return ResponseEntity.ok(todoService.createTodo(authentication.getName(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TodoDto> updateTodo(
        Authentication authentication,
        @PathVariable String id,
        @Valid @RequestBody TodoDto request
    ) {
        return ResponseEntity.ok(todoService.updateTodo(authentication.getName(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTodo(Authentication authentication, @PathVariable String id) {
        todoService.deleteTodo(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
