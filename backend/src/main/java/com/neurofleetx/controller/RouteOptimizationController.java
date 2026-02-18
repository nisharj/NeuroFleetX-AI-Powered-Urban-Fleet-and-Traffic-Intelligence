package com.neurofleetx.controller;

import com.neurofleetx.dto.RouteOptimizationResponse;
import com.neurofleetx.dto.RouteRequest;
import com.neurofleetx.service.RouteOptimizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/routes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class RouteOptimizationController {

    private static final Logger logger = LoggerFactory.getLogger(RouteOptimizationController.class);
    private final RouteOptimizationService routeOptimizationService;

    /**
     * Get optimized routes with best and alternate options (GET with query params)
     * GET
     * /api/routes/optimize?pickupLat=13.0827&pickupLng=80.2707&dropLat=12.9716&dropLng=77.5946
     */
    @GetMapping("/optimize")
    public ResponseEntity<RouteOptimizationResponse> getOptimizedRoutesWithParams(
            @RequestParam("pickupLat") Double pickupLat,
            @RequestParam("pickupLng") Double pickupLng,
            @RequestParam("dropLat") Double dropLat,
            @RequestParam("dropLng") Double dropLng) {

        logger.info("Received route optimization request from ({}, {}) to ({}, {})",
                pickupLat, pickupLng, dropLat, dropLng);

        try {
            RouteRequest request = new RouteRequest();
            request.setPickupLatitude(pickupLat);
            request.setPickupLongitude(pickupLng);
            request.setDropLatitude(dropLat);
            request.setDropLongitude(dropLng);

            RouteOptimizationResponse response = routeOptimizationService
                    .getOptimizedRoutes(request);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error optimizing routes: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to optimize routes: " + e.getMessage());
        }
    }

    /**
     * Get optimized routes with best and alternate options (POST with JSON body)
     * POST /api/routes/optimize
     */
    @PostMapping("/optimize")
    public ResponseEntity<RouteOptimizationResponse> getOptimizedRoutes(
            @Valid @RequestBody RouteRequest request) {

        logger.info("Received route optimization request from ({}, {}) to ({}, {})",
                request.getPickupLatitude(), request.getPickupLongitude(),
                request.getDropLatitude(), request.getDropLongitude());

        try {
            RouteOptimizationResponse response = routeOptimizationService
                    .getOptimizedRoutes(request);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error optimizing routes: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to optimize routes: " + e.getMessage());
        }
    }
}
