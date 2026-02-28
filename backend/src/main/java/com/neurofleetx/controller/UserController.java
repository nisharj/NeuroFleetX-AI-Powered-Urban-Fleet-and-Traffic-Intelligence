package com.neurofleetx.controller;

import com.neurofleetx.dto.MessageResponse;
import com.neurofleetx.model.User;
import com.neurofleetx.repository.BookingRepository;
import com.neurofleetx.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private BookingRepository bookingRepository;

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

            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("name", user.getName());
            response.put("email", user.getEmail());
            response.put("role", user.getRole());
            response.put("phone", user.getPhone());
            response.put("address", user.getAddress());
            response.put("licenseNumber", user.getLicenseNumber());
            response.put("isActive", user.getIsActive());
            response.put("approvalStatus", user.getApprovalStatus());
            response.put("detailsSubmitted", user.getDetailsSubmitted());
            response.put("createdAt", user.getCreatedAt());
            response.put("updatedAt", user.getUpdatedAt());
            response.put("vehicle", user.getVehicle());

            if (user.getRole() == User.Role.DRIVER) {
                Long completedTrips = bookingRepository.countCompletedRidesByDriver(user.getId());
                Double avgRating = bookingRepository.findAverageDriverRating(user.getId());
                Long totalRatings = bookingRepository.countDriverRatings(user.getId());

                response.put("completedTrips", completedTrips != null ? completedTrips : 0L);
                response.put("totalDriverRatings", totalRatings != null ? totalRatings : 0L);
                response.put(
                        "driverRating",
                        avgRating != null
                                ? BigDecimal.valueOf(avgRating).setScale(2, RoundingMode.HALF_UP)
                                : BigDecimal.ZERO);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error fetching current user: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
}
