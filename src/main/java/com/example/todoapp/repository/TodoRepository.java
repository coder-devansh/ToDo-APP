package com.example.todoapp.repository;

import com.example.todoapp.entity.Todo;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface TodoRepository extends MongoRepository<Todo, String> {

    List<Todo> findByUserId(String userId);

    Optional<Todo> findByIdAndUserId(String id, String userId);
}
