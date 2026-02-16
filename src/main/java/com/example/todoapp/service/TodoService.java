package com.example.todoapp.service;

import com.example.todoapp.dto.TodoDto;
import com.example.todoapp.entity.Todo;
import com.example.todoapp.entity.User;
import com.example.todoapp.repository.TodoRepository;
import com.example.todoapp.repository.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class TodoService {

    private final TodoRepository todoRepository;
    private final UserRepository userRepository;

    public TodoService(TodoRepository todoRepository, UserRepository userRepository) {
        this.todoRepository = todoRepository;
        this.userRepository = userRepository;
    }

    public List<TodoDto> getTodosForCurrentUser(String username) {
        User user = getUserByUsername(username);
        return todoRepository.findByUserId(user.getId())
            .stream()
            .map(this::toDto)
            .toList();
    }

    public TodoDto createTodo(String username, TodoDto request) {
        User user = getUserByUsername(username);

        Todo todo = new Todo();
        todo.setTitle(request.title());
        todo.setDescription(request.description());
        todo.setCompleted(request.completed());
        todo.setUserId(user.getId());

        return toDto(todoRepository.save(todo));
    }

    public TodoDto updateTodo(String username, String id, TodoDto request) {
        User user = getUserByUsername(username);

        Todo todo = todoRepository.findByIdAndUserId(id, user.getId())
            .orElseThrow(() -> new IllegalArgumentException("Todo not found"));

        todo.setTitle(request.title());
        todo.setDescription(request.description());
        todo.setCompleted(request.completed());

        return toDto(todoRepository.save(todo));
    }

    public void deleteTodo(String username, String id) {
        User user = getUserByUsername(username);

        Todo todo = todoRepository.findByIdAndUserId(id, user.getId())
            .orElseThrow(() -> new IllegalArgumentException("Todo not found"));

        todoRepository.delete(todo);
    }

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private TodoDto toDto(Todo todo) {
        return new TodoDto(
            todo.getId(),
            todo.getTitle(),
            todo.getDescription(),
            todo.isCompleted()
        );
    }
}
