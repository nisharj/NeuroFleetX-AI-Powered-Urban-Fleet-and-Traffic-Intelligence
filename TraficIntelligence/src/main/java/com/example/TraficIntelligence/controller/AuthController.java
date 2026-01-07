package com.example.TraficIntelligence.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.TraficIntelligence.dto.LoginRequest;
import com.example.TraficIntelligence.model.Role;
import com.example.TraficIntelligence.model.User;
import com.example.TraficIntelligence.repository.UserRepository;

import com.example.TraficIntelligence.util.JwtUtil;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public AuthController(JwtUtil jwtUtil, UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!encoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String token = jwtUtil.generateToken(
            user.getEmail(),
            user.getRole()
        );

        return ResponseEntity.ok(Map.of(
            "token", token,
            "role", user.getRole()
        ));
    }


    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {

        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity
                    .badRequest()
                    .body("Email already exists");
        }

        if (user.getRole() == null) {
            user.setRole(Role.CUSTOMER);
        }

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        user.setPassword(encoder.encode(user.getPassword()));

        userRepository.save(user);
        return ResponseEntity.ok("User registered successfully");
    }
}
