package com.neurofleetx.controller;

import com.neurofleetx.model.User;
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

@RestController
@RequestMapping("/api/v1/drivers")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminDriverController {

    private static final Logger logger = LoggerFactory.getLogger(AdminDriverController.class);

    private final DriverService driverService;
    private final UserRepository userRepository;

    /**
     * Get all drivers pending approval
     * Accessible by ADMIN and FLEET_MANAGER
     */
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingDrivers() {
        try {
            List<User> pendingDrivers = userRepository.findByRoleAndApprovalStatus(
                    User.Role.DRIVER,
                    User.ApprovalStatus.PENDING_ACCOUNT_APPROVAL);

            List<Map<String, Object>> driverList = pendingDrivers.stream()
                    .map(driver -> {
                        Map<String, Object> driverInfo = new HashMap<>();
                        driverInfo.put("id", driver.getId());
                        driverInfo.put("name", driver.getName());
                        driverInfo.put("email", driver.getEmail());
                        driverInfo.put("phone", driver.getPhone());
                        driverInfo.put("licenseNumber", driver.getLicenseNumber());
                        driverInfo.put("approvalStatus", driver.getApprovalStatus().name());
                        driverInfo.put("detailsSubmitted", driver.getDetailsSubmitted());
                        driverInfo.put("createdAt", driver.getCreatedAt());

                        if (driver.getVehicle() != null) {
                            Map<String, Object> vehicleInfo = new HashMap<>();
                            vehicleInfo.put("name", driver.getVehicle().getName());
                            vehicleInfo.put("type", driver.getVehicle().getType().name());
                            vehicleInfo.put("model", driver.getVehicle().getModel());
                            vehicleInfo.put("manufacturer", driver.getVehicle().getManufacturer());
                            vehicleInfo.put("year", driver.getVehicle().getYear());
                            vehicleInfo.put("seats", driver.getVehicle().getSeats());
                            vehicleInfo.put("fuelType", driver.getVehicle().getFuelType().name());
                            vehicleInfo.put("pricePerHour", driver.getVehicle().getPricePerHour());
                            driverInfo.put("vehicle", vehicleInfo);
                        }

                        return driverInfo;
                    })
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
     */
    @GetMapping("/all")
    public ResponseEntity<?> getAllDrivers() {
        try {
            List<User> allDrivers = userRepository.findByRole(User.Role.DRIVER);

            List<Map<String, Object>> driverList = allDrivers.stream()
                    .map(driver -> {
                        Map<String, Object> driverInfo = new HashMap<>();
                        driverInfo.put("id", driver.getId());
                        driverInfo.put("name", driver.getName());
                        driverInfo.put("email", driver.getEmail());
                        driverInfo.put("phone", driver.getPhone());
                        driverInfo.put("approvalStatus", driver.getApprovalStatus().name());
                        driverInfo.put("detailsSubmitted", driver.getDetailsSubmitted());
                        driverInfo.put("isActive", driver.getIsActive());

                        if (driver.getVehicle() != null) {
                            driverInfo.put("vehicleName", driver.getVehicle().getName());
                            driverInfo.put("vehicleType", driver.getVehicle().getType().name());
                            driverInfo.put("vehicleStatus", driver.getVehicle().getStatus().name());
                        }

                        return driverInfo;
                    })
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
}
