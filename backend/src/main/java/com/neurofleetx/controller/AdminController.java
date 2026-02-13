package com.neurofleetx.controller;

import com.neurofleetx.dto.MessageResponse;
import com.neurofleetx.model.User;
import com.neurofleetx.model.Vehicle;
import com.neurofleetx.repository.BookingRepository;
import com.neurofleetx.repository.UserRepository;
import com.neurofleetx.repository.VehicleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AdminController {

    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private BookingRepository bookingRepository;

    /**
     * Get all pending user approvals
     */
    @GetMapping("/pending-approvals")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    public ResponseEntity<?> getPendingApprovals() {
        try {
            logger.info("Fetching pending approvals");

            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            boolean isFleetManager = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_FLEET_MANAGER"));

            logger.info("Request from: {}, isFleetManager: {}",
                    auth != null ? auth.getName() : "unknown", isFleetManager);

            List<User> pendingUsers = userRepository.findByApprovalStatus(User.ApprovalStatus.PENDING_ACCOUNT_APPROVAL);
            logger.info("Found {} pending users", pendingUsers != null ? pendingUsers.size() : 0);

            // Filter users
            List<User> filteredUsers = pendingUsers.stream()
                    .filter(user -> {
                        if (isFleetManager) {
                            // Fleet Managers can only see pending Drivers
                            return user.getRole() == User.Role.DRIVER;
                        } else {
                            // Admins see Fleet Managers and Drivers
                            return user.getRole() == User.Role.FLEET_MANAGER ||
                                    user.getRole() == User.Role.DRIVER;
                        }
                    })
                    .toList();

            logger.info("Returning {} filtered pending users", filteredUsers.size());
            return ResponseEntity.ok(filteredUsers);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error fetching pending approvals: " + e.getMessage()));
        }
    }

    /**
     * Approve a user
     */
    @PostMapping("/approve-user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    public ResponseEntity<?> approveUser(@PathVariable Long userId) {
        try {
            logger.info("Approval request for user ID: {}", userId);

            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            boolean isFleetManager = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_FLEET_MANAGER"));

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Check if Fleet Manager is trying to approve non-driver
            if (isFleetManager && user.getRole() != User.Role.DRIVER) {
                return ResponseEntity.status(403)
                        .body(new MessageResponse("Error: Fleet Managers can only approve Drivers"));
            }

            // Only approve if pending account approval (Phase 1)
            if (user.getApprovalStatus() != User.ApprovalStatus.PENDING_ACCOUNT_APPROVAL) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("User is not in pending account approval status"));
            }

            // Approve user account (Phase 1)
            user.setApprovalStatus(User.ApprovalStatus.ACCOUNT_APPROVED);
            user.setIsActive(true);
            userRepository.save(user);

            logger.info("User account approved successfully (Phase 1): id={}, name={}, role={}",
                    user.getId(), user.getName(), user.getRole());

            return ResponseEntity.ok(new MessageResponse(
                    "User " + user.getName() + " (" + user.getRole()
                            + ") account has been approved successfully. They can now log in."));
        } catch (Exception e) {
            logger.error("Error approving user {}: {}", userId, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error approving user: " + e.getMessage()));
        }
    }

    /**
     * Reject a user
     */
    @PostMapping("/reject-user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    public ResponseEntity<?> rejectUser(@PathVariable Long userId,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            logger.info("Rejection request for user ID: {}", userId);

            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            boolean isFleetManager = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_FLEET_MANAGER"));

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Check if Fleet Manager is trying to reject non-driver
            if (isFleetManager && user.getRole() != User.Role.DRIVER) {
                return ResponseEntity.status(403)
                        .body(new MessageResponse("Error: Fleet Managers can only reject Drivers"));
            }

            // Only reject if pending account approval (Phase 1)
            if (user.getApprovalStatus() != User.ApprovalStatus.PENDING_ACCOUNT_APPROVAL) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("User is not in pending account approval status"));
            }

            // Reject user
            user.setApprovalStatus(User.ApprovalStatus.REJECTED);
            user.setIsActive(false);
            userRepository.save(user);

            String reason = body != null ? body.getOrDefault("reason", "No reason provided") : "No reason provided";

            logger.info("User rejected successfully: id={}, name={}, role={}, reason={}",
                    user.getId(), user.getName(), user.getRole(), reason);

            return ResponseEntity.ok(new MessageResponse(
                    "User " + user.getName() + " (" + user.getRole() + ") has been rejected. Reason: " + reason));
        } catch (Exception e) {
            logger.error("Error rejecting user {}: {}", userId, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error rejecting user: " + e.getMessage()));
        }
    }

    /**
     * Check if an email is registered (for debugging login issues)
     */
    @GetMapping("/check-email")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> checkEmailRegistration(@RequestParam String email) {
        try {
            logger.info("Checking if email is registered: {}", email);

            var user = userRepository.findByEmail(email);

            if (user.isEmpty()) {
                logger.info("Email not found in database: {}", email);
                return ResponseEntity.ok(Map.of(
                        "registered", false,
                        "email", email,
                        "message", "This email is not registered in the system"));
            }

            User foundUser = user.get();
            logger.info("Email found: id={}, name={}, role={}, approvalStatus={}, isActive={}",
                    foundUser.getId(), foundUser.getName(), foundUser.getRole(),
                    foundUser.getApprovalStatus(), foundUser.getIsActive());

            return ResponseEntity.ok(Map.of(
                    "registered", true,
                    "email", foundUser.getEmail(),
                    "name", foundUser.getName(),
                    "role", foundUser.getRole().toString(),
                    "approvalStatus", foundUser.getApprovalStatus().toString(),
                    "isActive", foundUser.getIsActive(),
                    "message", "Email is registered"));
        } catch (Exception e) {
            logger.error("Error checking email: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error checking email: " + e.getMessage()));
        }
    }

    /**
     * Get admin dashboard metrics
     */
    @GetMapping("/metrics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAdminMetrics() {
        try {
            logger.info("Fetching admin dashboard metrics");

            // Calculate total users
            long totalUsers = 0;
            try {
                totalUsers = userRepository.count();
                logger.info("Total users: {}", totalUsers);
            } catch (Exception e) {
                logger.error("Error counting users: {}", e.getMessage());
            }

            // Calculate total vehicles
            long totalVehicles = 0;
            try {
                totalVehicles = vehicleRepository.count();
                logger.info("Total vehicles: {}", totalVehicles);
            } catch (Exception e) {
                logger.error("Error counting vehicles: {}", e.getMessage());
            }

            // Calculate active fleets (vehicles with AVAILABLE status)
            long activeFleets = 0;
            try {
                List<Vehicle> availableVehicles = vehicleRepository.findByStatus(Vehicle.VehicleStatus.AVAILABLE);
                activeFleets = availableVehicles != null ? availableVehicles.size() : 0;
                logger.info("Active fleets: {}", activeFleets);
            } catch (Exception e) {
                logger.error("Error counting active fleets: {}", e.getMessage());
            }

            // Calculate today's bookings
            long todayBookings = 0;
            try {
                LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
                LocalDateTime endOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
                todayBookings = bookingRepository.countBookingsBetweenDates(startOfDay, endOfDay);
                logger.info("Today's bookings: {}", todayBookings);
            } catch (Exception e) {
                logger.error("Error counting today's bookings: {}", e.getMessage());
            }

            // Build response
            Map<String, Object> metrics = new HashMap<>();
            metrics.put("totalUsers", totalUsers);
            metrics.put("totalVehicles", totalVehicles);
            metrics.put("activeFleets", activeFleets);
            metrics.put("todayBookings", todayBookings);

            logger.info("Admin metrics successfully calculated: {}", metrics);
            return ResponseEntity.ok(metrics);

        } catch (Exception e) {
            logger.error("Error fetching admin metrics: {}", e.getMessage(), e);

            // Return safe defaults on error
            Map<String, Object> defaultMetrics = new HashMap<>();
            defaultMetrics.put("totalUsers", 0);
            defaultMetrics.put("totalVehicles", 0);
            defaultMetrics.put("activeFleets", 0);
            defaultMetrics.put("todayBookings", 0);

            return ResponseEntity.ok(defaultMetrics);
        }
    }

    /**
     * Get all drivers (for fleet manager)
     */
    @GetMapping("/drivers")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    public ResponseEntity<?> getDrivers() {
        try {
            List<User> users = userRepository.findAll();
            List<User> drivers = users.stream()
                    .filter(user -> user.getRole() == User.Role.DRIVER)
                    .toList();
            return ResponseEntity.ok(drivers);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error fetching drivers: " + e.getMessage()));
        }
    }

    /**
     * Toggle user active status
     */
    @PostMapping("/toggle-user-status/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> toggleUserStatus(@PathVariable Long userId) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            user.setIsActive(!user.getIsActive());
            userRepository.save(user);

            return ResponseEntity.ok(new MessageResponse(
                    "User " + user.getName() + " is now " + (user.getIsActive() ? "active" : "inactive")));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error toggling user status: " + e.getMessage()));
        }
    }

    /**
     * Get all users by role (for user management)
     * GET /api/admin/users?role=DRIVER|FLEET_MANAGER|CUSTOMER
     */
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUsersByRole(@RequestParam(required = false) String role) {
        try {
            logger.info("=== GET USERS BY ROLE ===");
            logger.info("Role filter: {}", role != null ? role : "ALL");

            List<User> users;

            if (role != null && !role.isEmpty()) {
                try {
                    User.Role roleEnum = User.Role.valueOf(role.toUpperCase());
                    users = userRepository.findByRole(roleEnum);
                    logger.info("Found {} users with role {}", users.size(), roleEnum);
                } catch (IllegalArgumentException e) {
                    logger.error("Invalid role: {}", role);
                    return ResponseEntity.badRequest()
                            .body(new MessageResponse("Invalid role: " + role));
                }
            } else {
                // Return all users except ADMIN
                users = userRepository.findAll().stream()
                        .filter(u -> u.getRole() != User.Role.ADMIN)
                        .toList();
                logger.info("Found {} total users (excluding admins)", users.size());
            }

            return ResponseEntity.ok(users);
        } catch (Exception e) {
            logger.error("Error fetching users: ", e);
            return ResponseEntity.status(500)
                    .body(new MessageResponse("Error fetching users: " + e.getMessage()));
        }
    }

    /**
     * Update user status (activate/deactivate)
     * PATCH /api/admin/users/:id/status
     */
    @PatchMapping("/users/{userId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUserStatus(
            @PathVariable Long userId,
            @RequestBody Map<String, Boolean> statusUpdate) {
        try {
            logger.info("=== UPDATE USER STATUS ===");
            logger.info("User ID: {}", userId);
            logger.info("New status: {}", statusUpdate.get("isActive"));

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

            Boolean newStatus = statusUpdate.get("isActive");
            if (newStatus == null) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Status 'isActive' is required"));
            }

            // Prevent deactivating admin users
            if (user.getRole() == User.Role.ADMIN) {
                return ResponseEntity.status(403)
                        .body(new MessageResponse("Cannot modify admin user status"));
            }

            user.setIsActive(newStatus);
            userRepository.save(user);

            logger.info("User {} ({}) status updated to: {}",
                    user.getName(), user.getEmail(), newStatus ? "ACTIVE" : "INACTIVE");

            Map<String, Object> response = new HashMap<>();
            response.put("message", "User status updated successfully");
            response.put("user", user);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error updating user status: ", e);
            return ResponseEntity.status(500)
                    .body(new MessageResponse("Error updating user status: " + e.getMessage()));
        }
    }
}
