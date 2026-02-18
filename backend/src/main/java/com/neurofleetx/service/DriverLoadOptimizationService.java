package com.neurofleetx.service;

import com.neurofleetx.dto.DriverAssignmentDTO;
import com.neurofleetx.model.Booking;
import com.neurofleetx.model.User;
import com.neurofleetx.model.Vehicle;
import com.neurofleetx.repository.BookingRepository;
import com.neurofleetx.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DriverLoadOptimizationService {

    private static final Logger logger = LoggerFactory.getLogger(DriverLoadOptimizationService.class);
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;

    /**
     * Finds the best driver for a ride based on:
     * 1. Driver approval status (must be APPROVED)
     * 2. Vehicle type match
     * 3. Driver online status (is active)
     * 4. Distance to pickup
     * 5. Current active rides count
     * 
     * Score calculation: distance + (activeRides * 2)
     * Lower score = better match
     */
    public DriverAssignmentDTO findOptimalDriver(
            String requestedVehicleType,
            Double pickupLatitude,
            Double pickupLongitude) {

        logger.info("Finding optimal driver for vehicle type: {} at location ({}, {})",
                requestedVehicleType, pickupLatitude, pickupLongitude);

        // Step 1: Fetch all eligible drivers
        List<User> allDrivers = userRepository.findByRole(User.Role.DRIVER);

        if (allDrivers.isEmpty()) {
            logger.warn("No drivers found in the system");
            return null;
        }

        logger.info("Total drivers in system: {}", allDrivers.size());

        // Step 2: Filter eligible drivers
        List<User> eligibleDrivers = allDrivers.stream()
                .filter(this::isDriverEligible)
                .filter(driver -> matchesVehicleType(driver, requestedVehicleType))
                .collect(Collectors.toList());

        logger.info("Eligible drivers after filtering: {}", eligibleDrivers.size());

        if (eligibleDrivers.isEmpty()) {
            logger.warn("No eligible drivers found for vehicle type: {}", requestedVehicleType);
            return null;
        }

        // Step 3: Calculate scores for each driver
        List<DriverAssignmentDTO> driverScores = new ArrayList<>();

        for (User driver : eligibleDrivers) {
            try {
                DriverAssignmentDTO assignmentInfo = calculateDriverScore(
                        driver, pickupLatitude, pickupLongitude);
                driverScores.add(assignmentInfo);
            } catch (Exception e) {
                logger.error("Error calculating score for driver {}: {}",
                        driver.getId(), e.getMessage(), e);
            }
        }

        if (driverScores.isEmpty()) {
            return null;
        }

        // Step 4: Sort by score (ascending - lower is better)
        driverScores.sort(Comparator.comparing(DriverAssignmentDTO::getAssignmentScore));

        DriverAssignmentDTO bestDriver = driverScores.get(0);
        logger.info("Best driver found: {} (ID: {}) with score: {}, distance: {} km, active rides: {}",
                bestDriver.getDriverName(),
                bestDriver.getDriverId(),
                bestDriver.getAssignmentScore(),
                bestDriver.getDistanceToPickup(),
                bestDriver.getActiveRidesCount());

        return bestDriver;
    }

    /**
     * Gets all available drivers for display/selection
     */
    public List<DriverAssignmentDTO> getAllAvailableDrivers(
            String requestedVehicleType,
            Double pickupLatitude,
            Double pickupLongitude) {

        List<User> allDrivers = userRepository.findByRole(User.Role.DRIVER);

        List<User> eligibleDrivers = allDrivers.stream()
                .filter(this::isDriverEligible)
                .filter(driver -> matchesVehicleType(driver, requestedVehicleType))
                .collect(Collectors.toList());

        List<DriverAssignmentDTO> driverList = new ArrayList<>();

        for (User driver : eligibleDrivers) {
            try {
                DriverAssignmentDTO info = calculateDriverScore(
                        driver, pickupLatitude, pickupLongitude);
                driverList.add(info);
            } catch (Exception e) {
                logger.error("Error processing driver {}: {}", driver.getId(), e.getMessage());
            }
        }

        driverList.sort(Comparator.comparing(DriverAssignmentDTO::getAssignmentScore));

        return driverList;
    }

    /**
     * Check if driver is eligible for ride assignment
     */
    private boolean isDriverEligible(User driver) {
        // Must be approved (Phase 2 complete)
        if (driver.getApprovalStatus() != User.ApprovalStatus.APPROVED) {
            return false;
        }

        // Must be active
        if (driver.getIsActive() == null || !driver.getIsActive()) {
            return false;
        }

        // Must have vehicle
        if (driver.getVehicle() == null) {
            return false;
        }

        // Vehicle must be available
        if (driver.getVehicle().getStatus() != Vehicle.VehicleStatus.AVAILABLE) {
            return false;
        }

        return true;
    }

    /**
     * Check if driver's vehicle type matches the requested type
     */
    private boolean matchesVehicleType(User driver, String requestedVehicleType) {
        if (requestedVehicleType == null || requestedVehicleType.isEmpty()) {
            return true; // Any vehicle type is acceptable
        }

        if (driver.getVehicle() == null) {
            return false;
        }

        String driverVehicleType = driver.getVehicle().getType().name();
        return driverVehicleType.equalsIgnoreCase(requestedVehicleType);
    }

    /**
     * Calculate driver assignment score
     * Score = distance_to_pickup + (active_rides_count * 2)
     */
    private DriverAssignmentDTO calculateDriverScore(
            User driver,
            Double pickupLatitude,
            Double pickupLongitude) {

        DriverAssignmentDTO dto = new DriverAssignmentDTO();
        dto.setDriverId(driver.getId());
        dto.setDriverName(driver.getName());
        dto.setDriverEmail(driver.getEmail());
        dto.setDriverPhone(driver.getPhone());

        // Calculate distance to pickup
        BigDecimal distanceToPickup = calculateDistanceToPickup(
                driver, pickupLatitude, pickupLongitude);
        dto.setDistanceToPickup(distanceToPickup);

        // Get active rides count
        Integer activeRidesCount = getActiveRidesCount(driver.getId());
        dto.setActiveRidesCount(activeRidesCount);

        // Calculate score: distance + (activeRides * 2)
        BigDecimal score = distanceToPickup.add(
                BigDecimal.valueOf(activeRidesCount * 2));
        dto.setAssignmentScore(score);

        // Add vehicle info
        if (driver.getVehicle() != null) {
            Vehicle vehicle = driver.getVehicle();
            DriverAssignmentDTO.VehicleInfoDTO vehicleInfo = new DriverAssignmentDTO.VehicleInfoDTO();
            vehicleInfo.setVehicleId(vehicle.getId());
            vehicleInfo.setVehicleType(vehicle.getType().name());
            vehicleInfo.setVehicleName(vehicle.getName());
            vehicleInfo.setVehicleModel(vehicle.getModel());
            vehicleInfo.setPlateNumber(vehicle.getVehicleCode());
            vehicleInfo.setSeats(vehicle.getSeats());
            dto.setVehicle(vehicleInfo);
        }

        return dto;
    }

    /**
     * Calculate distance from driver's current location to pickup point
     */
    private BigDecimal calculateDistanceToPickup(
            User driver,
            Double pickupLatitude,
            Double pickupLongitude) {

        Vehicle vehicle = driver.getVehicle();

        // Default location if vehicle location is not set
        if (vehicle.getCurrentLatitude() == null || vehicle.getCurrentLongitude() == null) {
            // Return a default distance (e.g., 5 km) to still allow assignment
            return BigDecimal.valueOf(5.0);
        }

        double driverLat = vehicle.getCurrentLatitude().doubleValue();
        double driverLng = vehicle.getCurrentLongitude().doubleValue();

        double distance = calculateHaversineDistance(
                driverLat, driverLng, pickupLatitude, pickupLongitude);

        return BigDecimal.valueOf(distance).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Get count of active rides for a driver
     */
    private Integer getActiveRidesCount(Long driverId) {
        List<Booking.BookingStatus> activeStatuses = List.of(
                Booking.BookingStatus.ACCEPTED,
                Booking.BookingStatus.ARRIVED,
                Booking.BookingStatus.IN_PROGRESS,
                Booking.BookingStatus.STARTED);

        List<Booking> activeBookings = bookingRepository
                .findByDriverIdAndStatusIn(driverId, activeStatuses);

        return activeBookings.size();
    }

    /**
     * Haversine formula for calculating distance between two coordinates
     */
    private double calculateHaversineDistance(
            double lat1, double lon1, double lat2, double lon2) {

        final int EARTH_RADIUS = 6371; // Radius in kilometers

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                        * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS * c;
    }
}
