package com.neurofleetx.controller;

import com.neurofleetx.dto.FleetVehicleDTO;
import com.neurofleetx.dto.MessageResponse;
import com.neurofleetx.model.Booking;
import com.neurofleetx.model.User;
import com.neurofleetx.model.Vehicle;
import com.neurofleetx.repository.BookingRepository;
import com.neurofleetx.repository.UserRepository;
import com.neurofleetx.repository.VehicleRepository;
import com.neurofleetx.service.VehicleService;
import jakarta.validation.Valid;
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
import java.util.ArrayList;
import java.time.LocalDateTime;
import java.util.Objects;

@RestController
@RequestMapping("/api/fleet")
@CrossOrigin(origins = "*", maxAge = 3600)
public class FleetController {

    private static final Logger logger = LoggerFactory.getLogger(FleetController.class);

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private VehicleService vehicleService;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Get fleet manager dashboard metrics
     */
    @GetMapping("/metrics")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    public ResponseEntity<?> getFleetMetrics() {
        try {
            logger.info("=== FLEET METRICS REQUEST ===");

            // Get authentication context
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null) {
                logger.info("Fleet metrics request from user: {}, authorities: {}",
                        auth.getName(), auth.getAuthorities());
            } else {
                logger.error("No authentication context found for fleet metrics");
            }

            long totalVehicles = 0;
            long vehiclesInUse = 0;
            long vehiclesUnderMaintenance = 0;

            // Calculate total vehicles
            try {
                totalVehicles = vehicleRepository.count();
                logger.info("Total vehicles in system: {}", totalVehicles);
            } catch (Exception e) {
                logger.error("Error counting total vehicles: {}", e.getMessage(), e);
            }

            // Calculate vehicles in use
            try {
                List<Vehicle> inUseList = vehicleRepository.findByStatus(Vehicle.VehicleStatus.IN_USE);
                vehiclesInUse = inUseList != null ? inUseList.size() : 0;
                logger.info("Vehicles in use: {}", vehiclesInUse);
            } catch (Exception e) {
                logger.error("Error counting vehicles in use: {}", e.getMessage(), e);
            }

            // Calculate vehicles under maintenance
            try {
                List<Vehicle> maintenanceList = vehicleRepository.findByStatus(Vehicle.VehicleStatus.MAINTENANCE);
                vehiclesUnderMaintenance = maintenanceList != null ? maintenanceList.size() : 0;
                logger.info("Vehicles under maintenance: {}", vehiclesUnderMaintenance);
            } catch (Exception e) {
                logger.error("Error counting vehicles under maintenance: {}", e.getMessage(), e);
            }

            // Build response
            Map<String, Object> metrics = new HashMap<>();
            metrics.put("totalVehicles", totalVehicles);
            metrics.put("vehiclesInUse", vehiclesInUse);
            metrics.put("vehiclesUnderMaintenance", vehiclesUnderMaintenance);

            logger.info("Fleet metrics successfully calculated: {}", metrics);
            logger.info("=== FLEET METRICS SUCCESS ===");

            return ResponseEntity.ok(metrics);

        } catch (Exception e) {
            logger.error("=== FLEET METRICS ERROR ===");
            logger.error("Error fetching fleet metrics: {}", e.getMessage(), e);
            logger.error("Stack trace:", e);

            // Return safe defaults on error
            Map<String, Object> defaultMetrics = new HashMap<>();
            defaultMetrics.put("totalVehicles", 0);
            defaultMetrics.put("vehiclesInUse", 0);
            defaultMetrics.put("vehiclesUnderMaintenance", 0);

            logger.info("Returning default metrics due to error");
            return ResponseEntity.ok(defaultMetrics);
        }
    }

    /**
     * Get all vehicles in the fleet
     */
    @GetMapping("/vehicles")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'CUSTOMER')")
    public ResponseEntity<?> getAllFleetVehicles() {
        try {
            logger.info("Fetching all fleet vehicles");

            // Get authentication context for debugging
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null) {
                logger.info("Request user: {}, authorities: {}",
                        auth.getName(), auth.getAuthorities());
            } else {
                logger.warn("No authentication context found");
            }

            // Fetch vehicles with null check
            List<Vehicle> vehicles = null;
            try {
                vehicles = vehicleRepository.findAllWithCity();
                logger.info("Successfully fetched {} vehicles from database",
                        vehicles != null ? vehicles.size() : 0);
            } catch (Exception dbException) {
                logger.error("Database error while fetching vehicles: {}",
                        dbException.getMessage(), dbException);
                // Return empty list if DB query fails
                return ResponseEntity.ok(Collections.emptyList());
            }

            // Handle null result
            if (vehicles == null) {
                logger.warn("Vehicle repository returned null, returning empty list");
                return ResponseEntity.ok(Collections.emptyList());
            }

            List<FleetVehicleDTO> response = vehicles.stream()
                    .map(this::toFleetVehicleDTO)
                    .toList();

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error in getAllFleetVehicles endpoint: {}", e.getMessage(), e);

            // Return safe empty list instead of 500 error
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    /**
     * Get a specific vehicle by ID
     */
    @GetMapping("/vehicles/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'CUSTOMER')")
    public ResponseEntity<?> getFleetVehicleById(@PathVariable Long id) {
        try {
            logger.info("Fetching fleet vehicle with ID: {}", id);

            return vehicleService.getVehicleById(id)
                    .map(vehicle -> {
                        logger.info("Vehicle found: {}", vehicle.getVehicleCode());
                        return ResponseEntity.ok(toFleetVehicleDTO(vehicle));
                    })
                    .orElseGet(() -> {
                        logger.warn("Vehicle not found with ID: {}", id);
                        return ResponseEntity.notFound().build();
                    });

        } catch (Exception e) {
            logger.error("Error fetching vehicle {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(new MessageResponse("Error fetching vehicle: " + e.getMessage()));
        }
    }

    /**
     * Create a new vehicle in the fleet
     */
    @PostMapping("/vehicles")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    public ResponseEntity<?> createFleetVehicle(@Valid @RequestBody Vehicle vehicle) {
        try {
            logger.info("Creating new fleet vehicle: {}", vehicle.getVehicleCode());

            Vehicle createdVehicle = vehicleService.createVehicle(vehicle);
            logger.info("Successfully created vehicle with ID: {}", createdVehicle.getId());

            return ResponseEntity.ok(createdVehicle);

        } catch (IllegalArgumentException e) {
            logger.error("Validation error creating vehicle: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Validation error: " + e.getMessage()));
        } catch (Exception e) {
            logger.error("Error creating vehicle: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(new MessageResponse("Error creating vehicle: " + e.getMessage()));
        }
    }

    /**
     * Update an existing vehicle
     */
    @PutMapping("/vehicles/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    public ResponseEntity<?> updateFleetVehicle(
            @PathVariable Long id,
            @Valid @RequestBody Vehicle vehicleDetails) {
        try {
            logger.info("Updating fleet vehicle with ID: {}", id);

            Vehicle updatedVehicle = vehicleService.updateVehicle(id, vehicleDetails);
            logger.info("Successfully updated vehicle: {}", updatedVehicle.getVehicleCode());

            return ResponseEntity.ok(updatedVehicle);

        } catch (IllegalStateException e) {
            return ResponseEntity.status(409)
                    .body(new MessageResponse(e.getMessage()));
        } catch (RuntimeException e) {
            logger.error("Vehicle not found for update: {}", id);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error updating vehicle {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(new MessageResponse("Error updating vehicle: " + e.getMessage()));
        }
    }

    /**
     * Delete a vehicle from the fleet
     */
    @DeleteMapping("/vehicles/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteFleetVehicle(@PathVariable Long id) {
        try {
            logger.info("Deleting fleet vehicle with ID: {}", id);

            vehicleService.deleteVehicle(id);
            logger.info("Successfully deleted vehicle: {}", id);

            return ResponseEntity.ok(new MessageResponse("Vehicle deleted successfully"));

        } catch (IllegalStateException e) {
            return ResponseEntity.status(409)
                    .body(new MessageResponse(e.getMessage()));
        } catch (RuntimeException e) {
            logger.error("Vehicle not found for deletion: {}", id);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error deleting vehicle {}: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(new MessageResponse("Error deleting vehicle: " + e.getMessage()));
        }
    }

    /**
     * Get fleet statistics
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    public ResponseEntity<?> getFleetStats() {
        try {
            logger.info("Fetching fleet statistics");

            long totalVehicles = 0;
            long availableVehicles = 0;
            long inUseVehicles = 0;
            long maintenanceVehicles = 0;

            try {
                totalVehicles = vehicleRepository.count();

                List<Vehicle> available = vehicleRepository.findByStatus(Vehicle.VehicleStatus.AVAILABLE);
                availableVehicles = available != null ? available.size() : 0;

                List<Vehicle> inUse = vehicleRepository.findByStatus(Vehicle.VehicleStatus.IN_USE);
                inUseVehicles = inUse != null ? inUse.size() : 0;

                List<Vehicle> maintenance = vehicleRepository.findByStatus(Vehicle.VehicleStatus.MAINTENANCE);
                maintenanceVehicles = maintenance != null ? maintenance.size() : 0;

            } catch (Exception dbException) {
                logger.error("Database error calculating fleet stats: {}", dbException.getMessage());
            }

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalVehicles", totalVehicles);
            stats.put("availableVehicles", availableVehicles);
            stats.put("inUseVehicles", inUseVehicles);
            stats.put("maintenanceVehicles", maintenanceVehicles);

            logger.info("Fleet stats: {}", stats);
            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            logger.error("Error fetching fleet stats: {}", e.getMessage(), e);

            // Return safe defaults
            Map<String, Object> defaultStats = new HashMap<>();
            defaultStats.put("totalVehicles", 0);
            defaultStats.put("availableVehicles", 0);
            defaultStats.put("inUseVehicles", 0);
            defaultStats.put("maintenanceVehicles", 0);

            return ResponseEntity.ok(defaultStats);
        }
    }

    /**
     * Get vehicles that belong to APPROVED drivers (admin/manager approved)
     */
    @GetMapping("/vehicles/approved")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    public ResponseEntity<?> getApprovedDriverVehicles() {
        try {
            logger.info("Fetching approved driver vehicles");

            List<User> approvedDrivers = userRepository.findByRoleAndApprovalStatusWithVehicle(
                    User.Role.DRIVER,
                    User.ApprovalStatus.APPROVED);

            List<Long> vehicleIds = approvedDrivers.stream()
                    .map(User::getVehicle)
                    .filter(Objects::nonNull)
                    .map(Vehicle::getId)
                    .toList();

            if (vehicleIds.isEmpty()) {
                return ResponseEntity.ok(Collections.emptyList());
            }

            List<Vehicle> vehicles = vehicleRepository.findByIdInWithCity(vehicleIds);

            List<FleetVehicleDTO> response = vehicles.stream()
                    .map(this::toFleetVehicleDTO)
                    .toList();

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error fetching approved driver vehicles: {}", e.getMessage(), e);
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    private FleetVehicleDTO toFleetVehicleDTO(Vehicle vehicle) {
        FleetVehicleDTO dto = new FleetVehicleDTO();
        dto.setId(vehicle.getId());
        dto.setVehicleCode(vehicle.getVehicleCode());
        dto.setVehicleNumber(vehicle.getVehicleNumber());
        dto.setName(vehicle.getName());
        dto.setType(vehicle.getType() != null ? vehicle.getType().name() : null);
        dto.setModel(vehicle.getModel());
        dto.setYear(vehicle.getYear());
        dto.setSeats(vehicle.getSeats());
        dto.setFuelType(vehicle.getFuelType() != null ? vehicle.getFuelType().name() : null);
        dto.setStatus(vehicle.getStatus() != null ? vehicle.getStatus().name() : null);
        dto.setCurrentLatitude(vehicle.getCurrentLatitude());
        dto.setCurrentLongitude(vehicle.getCurrentLongitude());
        dto.setCurrentCityName(vehicle.getCurrentCity() != null ? vehicle.getCurrentCity().getName() : null);
        dto.setBatteryLevel(vehicle.getBatteryLevel());
        dto.setMileage(vehicle.getMileage());
        dto.setEngineHealth(vehicle.getEngineHealth());
        dto.setTireHealth(vehicle.getTireHealth());
        dto.setBrakeHealth(vehicle.getBrakeHealth());
        dto.setLastMaintenanceDate(vehicle.getLastMaintenanceDate());
        dto.setNextMaintenanceDate(vehicle.getNextMaintenanceDate());
        dto.setRating(vehicle.getRating());
        dto.setTotalRatings(vehicle.getTotalRatings());

        boolean lockedForRide = vehicleService.isVehicleOnRide(vehicle.getId())
                || vehicle.getStatus() == Vehicle.VehicleStatus.IN_USE;
        dto.setLockedForRide(lockedForRide);

        List<String> alerts = new ArrayList<>();
        String healthStatus = "HEALTHY";

        if (vehicle.getStatus() == Vehicle.VehicleStatus.MAINTENANCE) {
            healthStatus = "UNDER_MAINTENANCE";
            alerts.add("Vehicle is under maintenance");
        } else if (vehicle.getStatus() == Vehicle.VehicleStatus.OFFLINE) {
            healthStatus = "INACTIVE";
            alerts.add("Vehicle is inactive/offline");
        } else {
            if (vehicle.getNextMaintenanceDate() != null
                    && vehicle.getNextMaintenanceDate().isBefore(LocalDateTime.now().plusDays(7))) {
                healthStatus = "MAINTENANCE_DUE";
                alerts.add("Service due within 7 days");
            }
            if (vehicle.getEngineHealth() != null && vehicle.getEngineHealth() < 70) {
                healthStatus = "MAINTENANCE_DUE";
                alerts.add("Engine health below threshold");
            }
            if (vehicle.getTireHealth() != null && vehicle.getTireHealth() < 70) {
                healthStatus = "MAINTENANCE_DUE";
                alerts.add("Tire health below threshold");
            }
            if (vehicle.getBrakeHealth() != null && vehicle.getBrakeHealth() < 70) {
                healthStatus = "MAINTENANCE_DUE";
                alerts.add("Brake health below threshold");
            }
        }

        dto.setHealthStatus(healthStatus);
        dto.setHealthAlerts(alerts);

        List<Booking.BookingStatus> activeRideStatuses = List.of(
                Booking.BookingStatus.STARTED,
                Booking.BookingStatus.IN_PROGRESS);

        List<Booking> activeByVehicle = bookingRepository.findByVehicleIdAndStatusInOrderByCreatedAtDesc(
                vehicle.getId(),
                activeRideStatuses);

        if (!activeByVehicle.isEmpty()) {
            Booking booking = activeByVehicle.get(0);
            User driver = booking.getDriver();

            if (driver != null) {
                dto.setAssignedDriver(new FleetVehicleDTO.DriverSummary(
                        driver.getId(),
                        driver.getName(),
                        driver.getEmail(),
                        driver.getPhone()));
            }

            dto.setCurrentTrip(new FleetVehicleDTO.CurrentTrip(
                    booking.getId(),
                    booking.getBookingCode(),
                    booking.getPickupAddress(),
                    booking.getDropAddress(),
                    booking.getUser() != null ? booking.getUser().getId() : null,
                    booking.getUser() != null ? booking.getUser().getName() : null,
                    booking.getUser() != null ? booking.getUser().getPhone() : null,
                    booking.getStartedAt(),
                    booking.getStatus() != null ? booking.getStatus().name() : null));
        }

        return dto;
    }
}
