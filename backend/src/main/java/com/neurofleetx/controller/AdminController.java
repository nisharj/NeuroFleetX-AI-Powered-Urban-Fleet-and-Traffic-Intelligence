package com.neurofleetx.controller;

import com.neurofleetx.dto.MessageResponse;
import com.neurofleetx.model.User;
import com.neurofleetx.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    /**
     * Get all pending user approvals
     */
    @GetMapping("/pending-approvals")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    public ResponseEntity<?> getPendingApprovals() {
        try {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            boolean isFleetManager = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_FLEET_MANAGER"));

            List<User> pendingUsers = userRepository.findByApprovalStatus(User.ApprovalStatus.PENDING);

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

            // Only approve if pending
            if (user.getApprovalStatus() != User.ApprovalStatus.PENDING) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("User is not in pending status"));
            }

            // Approve user
            user.setApprovalStatus(User.ApprovalStatus.APPROVED);
            user.setIsActive(true);
            userRepository.save(user);

            return ResponseEntity.ok(new MessageResponse(
                    "User " + user.getName() + " (" + user.getRole() + ") has been approved successfully"));
        } catch (Exception e) {
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

            // Only reject if pending
            if (user.getApprovalStatus() != User.ApprovalStatus.PENDING) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("User is not in pending status"));
            }

            // Reject user
            user.setApprovalStatus(User.ApprovalStatus.REJECTED);
            user.setIsActive(false);
            userRepository.save(user);

            String reason = body != null ? body.getOrDefault("reason", "No reason provided") : "No reason provided";

            return ResponseEntity.ok(new MessageResponse(
                    "User " + user.getName() + " (" + user.getRole() + ") has been rejected. Reason: " + reason));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error rejecting user: " + e.getMessage()));
        }
    }

    /**
     * Get all users (for admin management)
     */
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllUsers() {
        try {
            List<User> users = userRepository.findAll();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error fetching users: " + e.getMessage()));
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
}
