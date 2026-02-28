package com.neurofleetx.controller;

import com.neurofleetx.model.User;
import com.neurofleetx.repository.UserRepository;
import com.neurofleetx.service.DriverService;
import com.neurofleetx.service.VehicleDetailsRequest;
import com.neurofleetx.service.DriverService.DriverEligibilityStatus;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/driver")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DriverController {

    private static final Logger logger = LoggerFactory.getLogger(DriverController.class);

    private final DriverService driverService;
    private final UserRepository userRepository;

    @PostMapping("/vehicle-details")
    public ResponseEntity<?> submitVehicleDetails(
            @RequestBody VehicleDetailsRequest request,
            Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Unauthorized"));
            }

            String userEmail = authentication.getName();
            logger.info("Submitting vehicle details for driver: {}", userEmail);

            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            User updatedUser = driverService.submitVehicleDetails(user.getId(), request);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Vehicle details submitted successfully. Pending admin approval.");
            response.put("status",
                    updatedUser.getApprovalStatus() != null ? updatedUser.getApprovalStatus().name() : null);
            response.put("detailsSubmitted", updatedUser.getDetailsSubmitted());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IllegalArgumentException e) {
            logger.warn("Invalid vehicle details payload: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error submitting vehicle details: {}", e.getMessage(), e);

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getClass().getSimpleName());
            errorResponse.put("message", e.getMessage() != null ? e.getMessage() : "Failed to submit vehicle details");
            errorResponse.put("details", e.toString());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/eligibility")
    public ResponseEntity<?> checkEligibility(Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Unauthorized"));
            }

            String userEmail = authentication.getName();
            logger.debug("Checking eligibility for driver: {}", userEmail);

            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            DriverEligibilityStatus status = driverService.getDriverEligibilityStatus(user.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("eligible", status.isEligible());
            response.put("reason", status.getReason());
            response.put("requiresAction", status.getRequiresAction());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error checking eligibility: {}", e.getMessage(), e);

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getClass().getSimpleName());
            errorResponse.put("message", e.getMessage() != null ? e.getMessage() : "Failed to check eligibility");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * ✅ FIXED: profile endpoint avoids LazyInitializationException by fetching
     * vehicle eagerly
     */
    @GetMapping("/profile")
    public ResponseEntity<?> getDriverProfile(Authentication authentication) {
        try {
            String userEmail = authentication.getName();

            logger.debug("Fetching profile for driver: {}", userEmail);

            // ✅ USE FETCH JOIN METHOD
            User user = userRepository.findByEmailWithVehicle(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("name", user.getName());
            response.put("email", user.getEmail());
            response.put("phone", user.getPhone());
            response.put("address", user.getAddress());
            response.put("licenseNumber", user.getLicenseNumber());
            response.put("detailsSubmitted", user.getDetailsSubmitted());
            response.put("approvalStatus", user.getApprovalStatus().name());
            response.put("isActive", user.getIsActive());

            if (user.getVehicle() != null) {
                Map<String, Object> vehicle = new HashMap<>();
                vehicle.put("id", user.getVehicle().getId());
                vehicle.put("name", user.getVehicle().getName());
                vehicle.put("type", user.getVehicle().getType().name());
                vehicle.put("model", user.getVehicle().getModel());
                vehicle.put("manufacturer", user.getVehicle().getManufacturer());
                vehicle.put("year", user.getVehicle().getYear());
                vehicle.put("seats", user.getVehicle().getSeats());
                vehicle.put("fuelType", user.getVehicle().getFuelType().name());
                vehicle.put("pricePerHour", user.getVehicle().getPricePerHour());
                vehicle.put("vehicleCode", user.getVehicle().getVehicleCode());
                vehicle.put("status", user.getVehicle().getStatus().name());
                vehicle.put("batteryLevel", user.getVehicle().getBatteryLevel());

                response.put("vehicle", vehicle);
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error getting driver profile", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", e.getClass().getSimpleName(),
                            "message", e.getMessage()
                    ));
        }
    }

}
