package com.neurofleetx.controller;

import com.neurofleetx.dto.DriverAssignmentDTO;
import com.neurofleetx.service.DriverLoadOptimizationService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/driver-optimization")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class DriverLoadOptimizationController {

    private static final Logger logger = LoggerFactory.getLogger(DriverLoadOptimizationController.class);
    private final DriverLoadOptimizationService driverLoadOptimizationService;

    /**
     * Find the optimal driver for a ride
     * GET /api/driver-optimization/find-best
     */
    @GetMapping("/find-best")
    public ResponseEntity<?> findBestDriver(
            @RequestParam(required = false) String vehicleType,
            @RequestParam Double pickupLatitude,
            @RequestParam Double pickupLongitude) {

        logger.info("Finding best driver for vehicle type: {} at location ({}, {})",
                vehicleType, pickupLatitude, pickupLongitude);

        try {
            DriverAssignmentDTO bestDriver = driverLoadOptimizationService
                    .findOptimalDriver(vehicleType, pickupLatitude, pickupLongitude);

            if (bestDriver == null) {
                Map<String, String> response = new HashMap<>();
                response.put("message", "No eligible drivers available");
                return ResponseEntity.ok(response);
            }

            return ResponseEntity.ok(bestDriver);
        } catch (Exception e) {
            logger.error("Error finding best driver: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to find optimal driver: " + e.getMessage());
        }
    }

    /**
     * Get all available drivers sorted by assignment score
     * GET /api/driver-optimization/available
     */
    @GetMapping("/available")
    public ResponseEntity<List<DriverAssignmentDTO>> getAvailableDrivers(
            @RequestParam(required = false) String vehicleType,
            @RequestParam Double pickupLatitude,
            @RequestParam Double pickupLongitude) {

        logger.info("Getting all available drivers for vehicle type: {} at location ({}, {})",
                vehicleType, pickupLatitude, pickupLongitude);

        try {
            List<DriverAssignmentDTO> drivers = driverLoadOptimizationService
                    .getAllAvailableDrivers(vehicleType, pickupLatitude, pickupLongitude);

            return ResponseEntity.ok(drivers);
        } catch (Exception e) {
            logger.error("Error getting available drivers: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get available drivers: " + e.getMessage());
        }
    }
}
