package com.neurofleetx.controller;

import com.neurofleetx.dto.RideLifecycleDTO;
import com.neurofleetx.service.RideLifecycleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST API for Complete Ride Lifecycle Management
 * Handles both customer and driver operations with JWT authentication
 */
@RestController
@RequestMapping("/api/rides")
@RequiredArgsConstructor
@Slf4j
public class RideLifecycleController {

    private final RideLifecycleService rideLifecycleService;

    // ===================== DRIVER ENDPOINTS =====================

    /**
     * GET /api/rides/pending?vehicleType=sedan
     * Get pending rides available for driver
     */
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingRides(
            @RequestParam String vehicleType,
            Authentication auth) {
        try {
            log.info("Fetching pending rides for vehicle type: {}", vehicleType);
            List<RideLifecycleDTO> rides = rideLifecycleService.getPendingRides(vehicleType);
            return ResponseEntity.ok(rides);
        } catch (Exception e) {
            return errorResponse(400, "Failed to fetch pending rides: " + e.getMessage());
        }
    }

    /**
     * PUT /api/rides/{bookingId}/accept
     * Driver accepts a ride
     */
    @PutMapping("/{bookingId}/accept")
    public ResponseEntity<?> acceptRide(
            @PathVariable Long bookingId,
            Authentication auth) {
        try {
            Long driverId = extractUserIdFromAuth(auth);
            log.info("Driver {} accepting ride {}", driverId, bookingId);

            RideLifecycleDTO ride = rideLifecycleService.driverAcceptRide(bookingId, driverId);
            return ResponseEntity.ok(ride);
        } catch (RuntimeException e) {
            log.warn("Failed to accept ride: {}", e.getMessage());
            return errorResponse(400, e.getMessage());
        } catch (Exception e) {
            return errorResponse(500, "Internal server error: " + e.getMessage());
        }
    }

    /**
     * PUT /api/rides/{bookingId}/arrived
     * Driver has arrived at pickup location
     */
    @PutMapping("/{bookingId}/arrived")
    public ResponseEntity<?> arrivedAtPickup(
            @PathVariable Long bookingId,
            Authentication auth) {
        try {
            Long driverId = extractUserIdFromAuth(auth);
            log.info("Driver {} arrived at pickup for ride {}", driverId, bookingId);

            RideLifecycleDTO ride = rideLifecycleService.driverArrivedAtPickup(bookingId, driverId);
            return ResponseEntity.ok(ride);
        } catch (RuntimeException e) {
            return errorResponse(400, e.getMessage());
        } catch (Exception e) {
            return errorResponse(500, "Internal server error");
        }
    }

    /**
     * PUT /api/rides/{bookingId}/start
     * Start the ride (after customer boards)
     */
    @PutMapping("/{bookingId}/start")
    public ResponseEntity<?> startRide(
            @PathVariable Long bookingId,
            Authentication auth) {
        try {
            Long driverId = extractUserIdFromAuth(auth);
            log.info("Driver {} starting ride {}", driverId, bookingId);

            RideLifecycleDTO ride = rideLifecycleService.startRide(bookingId, driverId);
            return ResponseEntity.ok(ride);
        } catch (RuntimeException e) {
            return errorResponse(400, e.getMessage());
        } catch (Exception e) {
            return errorResponse(500, "Internal server error");
        }
    }

    /**
     * PUT /api/rides/{bookingId}/complete
     * Complete the ride
     */
    @PutMapping("/{bookingId}/complete")
    public ResponseEntity<?> completeRide(
            @PathVariable Long bookingId,
            @RequestParam(required = false) Double finalLat,
            @RequestParam(required = false) Double finalLng,
            Authentication auth) {
        try {
            Long driverId = extractUserIdFromAuth(auth);
            log.info("Driver {} completing ride {}", driverId, bookingId);

            RideLifecycleDTO ride = rideLifecycleService.completeRide(
                    bookingId, driverId, finalLat, finalLng);
            return ResponseEntity.ok(ride);
        } catch (RuntimeException e) {
            return errorResponse(400, e.getMessage());
        } catch (Exception e) {
            return errorResponse(500, "Internal server error");
        }
    }

    /**
     * GET /api/rides/active
     * Get driver's currently active ride
     *
     * ✅ If no active ride -> 204 No Content
     */
    @GetMapping("/active")
    public ResponseEntity<?> getActiveRide(Authentication auth) {
        try {
            Long driverId = extractUserIdFromAuth(auth);
            RideLifecycleDTO ride = rideLifecycleService.getActiveRideForDriver(driverId);

            if (ride == null) {
                return ResponseEntity.noContent().build();
            }

            return ResponseEntity.ok(ride);

        } catch (RuntimeException e) {
            // ✅ treat "no active ride found" as normal -> 204
            log.info("No active ride for driver: {}", e.getMessage());
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Failed to fetch driver active ride", e);
            return errorResponse(500, "Internal server error");
        }
    }

    /**
     * PUT /api/rides/{bookingId}/cancel
     * Driver cancels ride before start
     */
    @PutMapping("/{bookingId}/cancel")
    public ResponseEntity<?> driverCancelRide(
            @PathVariable Long bookingId,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        try {
            Long driverId = extractUserIdFromAuth(auth);
            String reason = body.getOrDefault("reason", "Driver cancelled");
            log.info("Driver {} cancelling ride {}", driverId, bookingId);

            RideLifecycleDTO ride = rideLifecycleService.driverCancelRide(
                    bookingId, driverId, reason);
            return ResponseEntity.ok(ride);
        } catch (RuntimeException e) {
            return errorResponse(400, e.getMessage());
        } catch (Exception e) {
            return errorResponse(500, "Internal server error");
        }
    }

    // ===================== CUSTOMER ENDPOINTS =====================

    /**
     * GET /api/rides/customer/active
     * ✅ If no active ride -> 204 No Content
     */
    @GetMapping("/customer/active")
    public ResponseEntity<?> getCustomerActiveRide(Authentication auth) {
        try {
            Long customerId = extractUserIdFromAuth(auth);
            RideLifecycleDTO ride = rideLifecycleService.getActiveRideForCustomer(customerId);

            if (ride == null) {
                return ResponseEntity.noContent().build();
            }

            return ResponseEntity.ok(ride);

        } catch (RuntimeException e) {
            // ✅ treat "no active ride found" as normal -> 204
            log.info("No active ride for customer: {}", e.getMessage());
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Failed to fetch customer active ride", e);
            return errorResponse(500, "Internal server error");
        }
    }

    /**
     * GET /api/rides/customer/history
     * Get customer's ride history (completed/cancelled rides)
     */
    @GetMapping("/customer/history")
    public ResponseEntity<?> getCustomerHistory(Authentication auth) {
        try {
            Long customerId = extractUserIdFromAuth(auth);
            List<RideLifecycleDTO> history = rideLifecycleService.getCustomerRideHistory(customerId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return errorResponse(500, "Failed to fetch history");
        }
    }

    /**
     * PUT /api/rides/{bookingId}/customer-cancel
     * Customer cancels ride at any stage (except completed)
     */
    @PutMapping("/{bookingId}/customer-cancel")
    public ResponseEntity<?> customerCancelRide(
            @PathVariable Long bookingId,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        try {
            Long customerId = extractUserIdFromAuth(auth);
            String reason = body.getOrDefault("reason", "Customer cancelled");
            log.info("Customer {} cancelling ride {}", customerId, bookingId);

            RideLifecycleDTO ride = rideLifecycleService.customerCancelRide(
                    bookingId, customerId, reason);
            return ResponseEntity.ok(ride);
        } catch (RuntimeException e) {
            return errorResponse(400, e.getMessage());
        } catch (Exception e) {
            return errorResponse(500, "Internal server error");
        }
    }

    // ===================== DRIVER HISTORY =====================

    /**
     * GET /api/rides/driver/history
     * Get driver's ride history
     */
    @GetMapping("/driver/history")
    public ResponseEntity<?> getDriverHistory(Authentication auth) {
        try {
            Long driverId = extractUserIdFromAuth(auth);
            List<RideLifecycleDTO> history = rideLifecycleService.getDriverRideHistory(driverId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return errorResponse(500, "Failed to fetch history");
        }
    }

    // ===================== HELPER METHODS =====================

    /**
     * Extract user ID from JWT authentication
     * JWT subject claim contains user ID as string
     */
    private Long extractUserIdFromAuth(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }

        String email = auth.getName();
        try {
            // First try to parse as Long (legacy support)
            try {
                return Long.parseLong(email);
            } catch (NumberFormatException e) {
                // Email format - look up user by email
                return rideLifecycleService.getUserIdByEmail(email);
            }
        } catch (Exception e) {
            log.error("Failed to extract user ID from auth: {}", email);
            throw new RuntimeException("Invalid user identifier in token");
        }
    }

    /**
     * Build standardized error response
     */
    private ResponseEntity<?> errorResponse(int status, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", status);
        response.put("message", message);
        response.put("timestamp", System.currentTimeMillis());

        HttpStatus httpStatus = HttpStatus.valueOf(status);
        return new ResponseEntity<>(response, httpStatus);
    }
}
