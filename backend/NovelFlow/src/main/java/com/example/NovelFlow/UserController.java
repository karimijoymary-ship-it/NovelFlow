package com.example.NovelFlow;

import com.example.NovelFlow.entities.User;
import com.example.NovelFlow.repositories.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<User> updateUserRole(@PathVariable String id, @RequestBody Map<String, String> payload) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (payload.containsKey("role")) {
                user.setRole(payload.get("role"));
                userRepository.save(user);
                return ResponseEntity.ok(user);
            }
        }
        return ResponseEntity.notFound().build();
    }
}
