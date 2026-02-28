package com.neurofleetx.controller;

import com.neurofleetx.model.User;
import com.neurofleetx.model.Vehicle;
import com.neurofleetx.repository.BookingRepository;
import com.neurofleetx.repository.UserRepository;
import com.neurofleetx.service.DriverService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.math.BigDecimal;
import java.math.RoundingMode;

@RestController
@RequestMapping("/api/v1/drivers")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminDriverController {

    private static final Logger logger = LoggerFactory.getLogger(AdminDriverController.class);

    private final DriverService driverService;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;

    /**
     * Get all drivers pending account approval (Phase 1)
     * Accessible by ADMIN and FLEET_MANAGER
     */
    @GetMapping({ "/pending", "/pending-account-approval" })
    public ResponseEntity<?> getPendingDrivers() {
        try {
            List<User> pendingDrivers = userRepository.findByRoleAndApprovalStatusWithVehicle(
                    User.Role.DRIVER,
                    User.ApprovalStatus.PENDING_ACCOUNT_APPROVAL);

            List<Map<String, Object>> driverList = pendingDrivers.stream()
                    .map(this::buildDriverResponse)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(driverList);
        } catch (Exception e) {
            logger.error("Error getting pending drivers: {}", e.getMessage(), e);

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getClass().getSimpleName());
            errorResponse.put("message", e.getMessage() != null ? e.getMessage() : "Failed to get pending drivers");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Approve a driver
     */
    @PostMapping("/{driverId}/approve")
    public ResponseEntity<?> approveDriver(@PathVariable Long driverId) {
        try {
            logger.info("Approve driver: driverId={}", driverId);

            User approvedDriver = driverService.approveDriver(driverId);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Driver approved successfully");
            response.put("driverId", approvedDriver.getId());
            response.put("driverName", approvedDriver.getName());
            response.put("approvalStatus", approvedDriver.getApprovalStatus().name());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error approving driver: {}", e.getMessage(), e);

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getClass().getSimpleName());
            errorResponse.put("message", e.getMessage() != null ? e.getMessage() : "Failed to approve driver");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Reject a driver
     */
    @PostMapping("/{driverId}/reject")
    public ResponseEntity<?> rejectDriver(
            @PathVariable Long driverId,
            @RequestBody(required = false) Map<String, String> requestBody) {
        try {
            String reason = requestBody != null ? requestBody.get("reason") : "Not specified";

            logger.info("Reject driver: driverId={} reason={}", driverId, reason);

            User rejectedDriver = driverService.rejectDriver(driverId, reason);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Driver rejected");
            response.put("driverId", rejectedDriver.getId());
            response.put("driverName", rejectedDriver.getName());
            response.put("approvalStatus", rejectedDriver.getApprovalStatus().name());
            response.put("reason", reason);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error rejecting driver: {}", e.getMessage(), e);

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getClass().getSimpleName());
            errorResponse.put("message", e.getMessage() != null ? e.getMessage() : "Failed to reject driver");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Get all drivers with their status
     * Accessible via /all or root path
     */
    @GetMapping({ "/all", "" })
    public ResponseEntity<?> getAllDrivers() {
        try {
            List<User> allDrivers = userRepository.findByRoleWithVehicle(User.Role.DRIVER);

            List<Map<String, Object>> driverList = allDrivers.stream()
                    .map(this::buildDriverResponse)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(driverList);
        } catch (Exception e) {
            logger.error("Error getting all drivers: {}", e.getMessage(), e);

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getClass().getSimpleName());
            errorResponse.put("message", e.getMessage() != null ? e.getMessage() : "Failed to get drivers");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * PHASE 1: Approve driver account (allows login, but not ride access yet)
     */
    @PostMapping("/{driverId}/approve-account")
    public ResponseEntity<?> approveDriverAccount(@PathVariable Long driverId) {
        try {
            logger.info("Phase 1 - Approve account: driverId={}", driverId);

            User driver = userRepository.findById(driverId)
                    .orElseThrow(() -> new RuntimeException("Driver not found"));

            if (driver.getRole() != User.Role.DRIVER) {
                throw new RuntimeException("User is not a driver");
            }

            driver.setApprovalStatus(User.ApprovalStatus.ACCOUNT_APPROVED);
            driver = userRepository.save(driver);

            Map<String, Object> response = new HashMap<>();
            response.put("message",
                    "Driver account approved. Driver can now login but cannot receive rides until ride eligibility is approved.");
            response.put("driverId", driver.getId());
            response.put("driverName", driver.getName());
            response.put("approvalStatus", driver.getApprovalStatus().name());
            response.put("phase", "PHASE_1_COMPLETE");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error approving driver account: {}", e.getMessage(), e);

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getClass().getSimpleName());
            errorResponse.put("message", e.getMessage() != null ? e.getMessage() : "Failed to approve driver account");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * PHASE 2: Approve driver for ride eligibility (allows receiving ride requests)
     * This is the final approval that allows driver to receive rides
     */
    @PostMapping("/{driverId}/approve-rides")
    public ResponseEntity<?> approveDriverForRides(@PathVariable Long driverId) {
        try {
            logger.info("Phase 2 - Approve for rides: driverId={}", driverId);

            User driver = userRepository.findByIdWithVehicle(driverId)
                    .orElseThrow(() -> new IllegalArgumentException("Driver not found"));

            if (driver.getRole() != User.Role.DRIVER) {
                throw new IllegalArgumentException("User is not a driver");
            }

            if (!Boolean.TRUE.equals(driver.getDetailsSubmitted())) {
                throw new IllegalArgumentException(
                        "Driver has not submitted vehicle details and verification documents");
            }

            if (driver.getVehicle() == null) {
                throw new IllegalArgumentException("Driver does not have a vehicle registered");
            }

            // Set to fully APPROVED status (Phase 2 complete)
            driver.setApprovalStatus(User.ApprovalStatus.APPROVED);

            // Set vehicle to AVAILABLE
            driver.getVehicle().setStatus(Vehicle.VehicleStatus.AVAILABLE);

            driver = userRepository.save(driver);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Driver approved for ride eligibility. Driver can now receive ride requests.");
            response.put("driverId", driver.getId());
            response.put("driverName", driver.getName());
            response.put("approvalStatus", driver.getApprovalStatus().name());
            response.put("phase", "PHASE_2_COMPLETE");
            response.put("vehicleStatus", driver.getVehicle().getStatus().name());

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid approve-rides request for driverId={}: {}", driverId, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error approving driver for rides: {}", e.getMessage(), e);

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getClass().getSimpleName());
            errorResponse.put("message",
                    e.getMessage() != null ? e.getMessage() : "Failed to approve driver for rides");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Get drivers pending ride approval (already have account approval, submitted
     * documents)
     */
    @GetMapping("/pending-ride-approval")
    public ResponseEntity<?> getDriversPendingRideApproval() {
        try {
            List<User> pendingRideDrivers = userRepository.findByRoleAndApprovalStatusWithVehicle(
                    User.Role.DRIVER,
                    User.ApprovalStatus.ACCOUNT_APPROVED);

            // Filter only those who have submitted details
            List<Map<String, Object>> driverList = pendingRideDrivers.stream()
                    .filter(driver -> Boolean.TRUE.equals(driver.getDetailsSubmitted()))
                    .map(this::buildDriverResponse)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(driverList);
        } catch (Exception e) {
            logger.error("Error getting drivers pending ride approval: {}", e.getMessage(), e);

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getClass().getSimpleName());
            errorResponse.put("message", e.getMessage() != null ? e.getMessage() : "Failed to get pending drivers");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // ======================== Shared helper ========================

    /**
     * Build a unified driver response map with full vehicle details.
     * Used by all list endpoints to ensure consistent data.
     */
    private Map<String, Object> buildDriverResponse(User driver) {
        Map<String, Object> driverInfo = new HashMap<>();
        driverInfo.put("id", driver.getId());
        driverInfo.put("name", driver.getName());
        driverInfo.put("email", driver.getEmail());
        driverInfo.put("phone", driver.getPhone());
        driverInfo.put("address", driver.getAddress());
        driverInfo.put("licenseNumber", driver.getLicenseNumber());
        driverInfo.put("approvalStatus", driver.getApprovalStatus() != null ? driver.getApprovalStatus().name() : null);
        driverInfo.put("detailsSubmitted", driver.getDetailsSubmitted());
        driverInfo.put("isActive", driver.getIsActive());
        driverInfo.put("createdAt", driver.getCreatedAt());
        Long totalRatings = bookingRepository.countDriverRatings(driver.getId());
        Double avgRating = bookingRepository.findAverageDriverRating(driver.getId());
        Long completedTrips = bookingRepository.countCompletedRidesByDriver(driver.getId());
        driverInfo.put("totalDriverRatings", totalRatings != null ? totalRatings : 0L);
        driverInfo.put(
                "driverRating",
                avgRating != null
                        ? BigDecimal.valueOf(avgRating).setScale(2, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO);
        driverInfo.put("completedTrips", completedTrips != null ? completedTrips : 0L);

        if (driver.getVehicle() != null) {
            Map<String, Object> vehicleInfo = new HashMap<>();
            vehicleInfo.put("id", driver.getVehicle().getId());
            vehicleInfo.put("vehicleCode", driver.getVehicle().getVehicleCode());
            vehicleInfo.put("name", driver.getVehicle().getName());
            vehicleInfo.put("type",
                    driver.getVehicle().getType() != null ? driver.getVehicle().getType().name() : null);
            vehicleInfo.put("model", driver.getVehicle().getModel());
            vehicleInfo.put("manufacturer", driver.getVehicle().getManufacturer());
            vehicleInfo.put("year", driver.getVehicle().getYear());
            vehicleInfo.put("seats", driver.getVehicle().getSeats());
            vehicleInfo.put("fuelType",
                    driver.getVehicle().getFuelType() != null ? driver.getVehicle().getFuelType().name() : null);
            vehicleInfo.put("pricePerHour", driver.getVehicle().getPricePerHour());
            vehicleInfo.put("vehicleNumber", driver.getVehicle().getVehicleNumber());
            vehicleInfo.put("batteryLevel", driver.getVehicle().getBatteryLevel());
            vehicleInfo.put("status",
                    driver.getVehicle().getStatus() != null ? driver.getVehicle().getStatus().name() : null);
            driverInfo.put("vehicle", vehicleInfo);
        }

        return driverInfo;
    }
}
