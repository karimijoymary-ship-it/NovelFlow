package com.example.NovelFlow;

import com.example.NovelFlow.entities.User;
import com.example.NovelFlow.repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository, BCryptPasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findAll().stream()
                    .filter(u -> u.getEmail() != null && u.getEmail().trim().equalsIgnoreCase(email))
                    .findFirst();
        }
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
                return ResponseEntity.ok(user);
            }
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Invalid email or password"));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Email is already registered"));
        }

        User user = new User();
        user.setUserId(UUID.randomUUID().toString());
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setAcademicStream(request.getAcademicStream());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(savedUser);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email") != null ? request.get("email").trim().toLowerCase() : "";
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findAll().stream()
                    .filter(u -> u.getEmail() != null && u.getEmail().trim().equalsIgnoreCase(email))
                    .findFirst();
        }

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "No registered user found with that email address"));
        }

        User user = userOpt.get();
        String resetToken = String.format("%06d", new java.util.Random().nextInt(900000) + 100000);
        user.setResetToken(resetToken);
        user.setResetTokenExpiry(java.time.LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
            "message", "Reset code generated successfully! Enter code '" + resetToken + "' to reset your password.",
            "resetToken", resetToken
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email") != null ? request.get("email").trim().toLowerCase() : "";
        String resetToken = request.get("resetToken") != null ? request.get("resetToken").trim() : "";
        String newPassword = request.get("newPassword");

        if (newPassword == null || newPassword.length() < 4) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "New password must be at least 4 characters long"));
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findAll().stream()
                    .filter(u -> u.getEmail() != null && u.getEmail().trim().equalsIgnoreCase(email))
                    .findFirst();
        }

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Account not found"));
        }

        User user = userOpt.get();
        if (user.getResetToken() == null || !user.getResetToken().equals(resetToken)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Invalid reset code"));
        }

        if (user.getResetTokenExpiry() != null && java.time.LocalDateTime.now().isAfter(user.getResetTokenExpiry())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Reset code has expired. Please request a new code."));
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password reset successfully! You can now log in with your new password."));
    }

    public static class LoginRequest {
        private String email;
        private String password;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }

    public static class RegisterRequest {
        private String fullName;
        private String email;
        private String password;
        private String academicStream;

        public String getFullName() {
            return fullName;
        }

        public void setFullName(String fullName) {
            this.fullName = fullName;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }

        public String getAcademicStream() {
            return academicStream;
        }

        public void setAcademicStream(String academicStream) {
            this.academicStream = academicStream;
        }
    }
}
