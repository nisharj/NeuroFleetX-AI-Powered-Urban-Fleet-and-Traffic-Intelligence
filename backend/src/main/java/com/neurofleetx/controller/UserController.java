package com.neurofleetx.controller;

import com.neurofleetx.dto.MessageResponse;
import com.neurofleetx.model.User;
import com.neurofleetx.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserRepository userRepository;

    /**
     * Get current user's information
     */
    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('DRIVER', 'CUSTOMER', 'FLEET_MANAGER', 'ADMIN')")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userRepository.findByEmailWithVehicle(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            logger.info("User info requested: email={}, role={}, approvalStatus={}",
                    user.getEmail(), user.getRole(), user.getApprovalStatus());

            return ResponseEntity.ok(user);
        } catch (Exception e) {
            logger.error("Error fetching current user: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
}
