package com.neurofleetx.controller;

import com.neurofleetx.dto.BookingDTO;
import com.neurofleetx.dto.MessageResponse;
import com.neurofleetx.model.Booking;
import com.neurofleetx.model.User;
import com.neurofleetx.repository.BookingRepository;
import com.neurofleetx.repository.UserRepository;
import com.neurofleetx.service.BookingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customer")
@CrossOrigin(origins = "*", maxAge = 3600)
public class CustomerController {

    private static final Logger logger = LoggerFactory.getLogger(CustomerController.class);

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingService bookingService;

    /**
     * Get all bookings for the logged-in customer
     */
    @GetMapping("/bookings")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<?> getCustomerBookings() {
        try {
            logger.info("=== CUSTOMER BOOKINGS REQUEST ===");

            // Get authentication context
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();

            if (auth == null) {
                logger.error("No authentication context found");
                return ResponseEntity.status(401)
                        .body(new MessageResponse("Error: Unauthorized - No authentication"));
            }

            String userEmail = auth.getName();
            logger.info("Customer bookings request from user: {}", userEmail);

            // Use BookingService to return DTOs (avoids lazy-loading serialization errors)
            List<BookingDTO> bookings = bookingService.getUserBookings(userEmail);

            logger.info("Successfully retrieved {} bookings for {}", bookings.size(), userEmail);
            logger.info("=== CUSTOMER BOOKINGS SUCCESS ===");

            return ResponseEntity.ok(bookings);

        } catch (Exception e) {
            logger.error("=== CUSTOMER BOOKINGS ERROR ===");
            logger.error("Error fetching customer bookings: {}", e.getMessage(), e);

            // Return safe empty list instead of 500 error
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    /**
     * Get customer dashboard metrics
     */
    @GetMapping("/metrics")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<?> getCustomerMetrics() {
        try {
            logger.info("=== CUSTOMER METRICS REQUEST ===");

            // Get authentication context
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();

            if (auth == null) {
                logger.error("No authentication context found");
                Map<String, Object> defaultMetrics = new HashMap<>();
                defaultMetrics.put("totalBookings", 0);
                defaultMetrics.put("activeBookings", 0);
                defaultMetrics.put("completedBookings", 0);
                return ResponseEntity.ok(defaultMetrics);
            }

            String userEmail = auth.getName();
            logger.info("Customer metrics request from user: {}", userEmail);

            // Find user by email
            var optionalUser = userRepository.findByEmail(userEmail);

            if (optionalUser.isEmpty()) {
                logger.error("User not found: {}", userEmail);
                Map<String, Object> defaultMetrics = new HashMap<>();
                defaultMetrics.put("totalBookings", 0);
                defaultMetrics.put("activeBookings", 0);
                defaultMetrics.put("completedBookings", 0);
                return ResponseEntity.ok(defaultMetrics);
            }

            User customer = optionalUser.get();
            logger.info("Customer found: id={}, name={}", customer.getId(), customer.getName());

            long totalBookings = 0;
            long activeBookings = 0;
            long completedBookings = 0;

            try {
                // Use BookingService to get DTOs (avoids lazy-loading issues)
                List<BookingDTO> allBookings = bookingService.getUserBookings(customer.getEmail());
                totalBookings = allBookings != null ? allBookings.size() : 0;

                if (allBookings != null) {
                    activeBookings = allBookings.stream()
                            .filter(b -> {
                                String s = b.getStatus();
                                return "PENDING".equals(s) || "BROADCASTED".equals(s) ||
                                        "ACCEPTED".equals(s) || "ARRIVED".equals(s) ||
                                        "STARTED".equals(s) || "IN_PROGRESS".equals(s);
                            })
                            .count();

                    completedBookings = allBookings.stream()
                            .filter(b -> "COMPLETED".equals(b.getStatus()))
                            .count();
                }

                logger.info("Customer metrics: total={}, active={}, completed={}",
                        totalBookings, activeBookings, completedBookings);
            } catch (Exception dbException) {
                logger.error("Database error calculating metrics: {}", dbException.getMessage());
            }

            Map<String, Object> metrics = new HashMap<>();
            metrics.put("totalBookings", totalBookings);
            metrics.put("activeBookings", activeBookings);
            metrics.put("completedBookings", completedBookings);

            logger.info("=== CUSTOMER METRICS SUCCESS ===");
            return ResponseEntity.ok(metrics);

        } catch (Exception e) {
            logger.error("=== CUSTOMER METRICS ERROR ===");
            logger.error("Error fetching customer metrics: {}", e.getMessage(), e);

            // Return safe defaults
            Map<String, Object> defaultMetrics = new HashMap<>();
            defaultMetrics.put("totalBookings", 0);
            defaultMetrics.put("activeBookings", 0);
            defaultMetrics.put("completedBookings", 0);

            return ResponseEntity.ok(defaultMetrics);
        }
    }
}
