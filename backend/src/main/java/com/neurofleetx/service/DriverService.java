package com.neurofleetx.service;

import com.neurofleetx.model.User;
import com.neurofleetx.model.Vehicle;
import com.neurofleetx.repository.UserRepository;
import com.neurofleetx.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DriverService {

    private static final Logger logger = LoggerFactory.getLogger(DriverService.class);

    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;

    /**
     * Check if a driver is eligible to receive ride requests
     * Requirements:
     * 1. User must be a DRIVER
     * 2. Must have submitted vehicle details (detailsSubmitted = true)
     * 3. Must have an associated vehicle
     * 4. Vehicle must be in AVAILABLE status
     * 5. Approval status must be APPROVED
     */
    @Transactional(readOnly = true)
    public boolean isDriverEligibleForRides(Long driverId) {
        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        return isDriverEligibleForRides(driver);
    }

    public boolean isDriverEligibleForRides(User driver) {
        // Check if user is a driver
        if (driver.getRole() != User.Role.DRIVER) {
            return false;
        }

        // Check if details are submitted
        if (driver.getDetailsSubmitted() == null || !driver.getDetailsSubmitted()) {
            return false;
        }

        // Check if driver has a vehicle
        if (driver.getVehicle() == null) {
            return false;
        }

        // Check if vehicle is available
        if (driver.getVehicle().getStatus() != Vehicle.VehicleStatus.AVAILABLE) {
            return false;
        }

        // Check if driver is approved
        if (driver.getApprovalStatus() != User.ApprovalStatus.APPROVED) {
            return false;
        }

        return true;
    }

    /**
     * Submit vehicle details for a driver
     * This marks the driver as having submitted their details
     * and changes their approval status to PENDING_APPROVAL
     */
    @Transactional
    public User submitVehicleDetails(Long driverId, VehicleDetailsRequest request) {
        try {
            logger.debug("Starting submitVehicleDetails for driver ID: {}", driverId);
            validateVehicleDetailsRequest(request);

            User driver = userRepository.findById(driverId)
                    .orElseThrow(() -> new RuntimeException("Driver not found"));

            logger.debug("Driver found: {}", driver.getEmail());

            if (driver.getRole() != User.Role.DRIVER) {
                throw new RuntimeException("User is not a driver");
            }

            logger.debug("Creating/updating vehicle for driver: {}", driverId);

            // Create or update vehicle
            Vehicle vehicle;
            if (driver.getVehicle() != null) {
                vehicle = driver.getVehicle();
                logger.debug("Updating existing vehicle: {}", vehicle.getId());
            } else {
                vehicle = new Vehicle();
                vehicle.setVehicleCode(generateVehicleCode());
                vehicle.setCreatedAt(LocalDateTime.now());
                logger.debug("Creating new vehicle with code: {}", vehicle.getVehicleCode());
            }

            // ✅ SAFE Enum conversions (no more valueOf crashes)
            Vehicle.VehicleType vehicleTypeEnum = request.getVehicleTypeEnum();
            Vehicle.FuelType fuelTypeEnum = request.getFuelTypeEnum();

            if (vehicleTypeEnum == null) {
                throw new IllegalArgumentException("Invalid vehicleType: " + request.getVehicleType());
            }
            if (fuelTypeEnum == null) {
                throw new IllegalArgumentException("Invalid fuelType: " + request.getFuelType());
            }

            // Update vehicle details
            vehicle.setName(request.getVehicleName());
            vehicle.setType(vehicleTypeEnum);
            vehicle.setModel(request.getModel());
            vehicle.setManufacturer(request.getManufacturer());
            vehicle.setYear(request.getYear());
            vehicle.setSeats(request.getSeats());
            vehicle.setFuelType(fuelTypeEnum);
            vehicle.setPricePerHour(request.getPricePerHour());
            vehicle.setStatus(Vehicle.VehicleStatus.OFFLINE); // Offline until approved
            vehicle.setUpdatedAt(LocalDateTime.now());

            // Optional battery level
            if (request.getBatteryLevel() != null) {
                vehicle.setBatteryLevel(request.getBatteryLevel());
            }

            // Store license plate as vehicle number
            if (request.getLicensePlate() != null && !request.getLicensePlate().isEmpty()) {
                vehicle.setVehicleNumber(request.getLicensePlate());
            } else {
                vehicle.setVehicleNumber(vehicle.getVehicleCode());
            }

            // Save vehicle
            vehicle = vehicleRepository.save(vehicle);
            logger.debug("Vehicle saved with ID: {}", vehicle.getId());

            // Update driver details
            driver.setVehicle(vehicle);
            driver.setDetailsSubmitted(true);
            // Set status to ACCOUNT_APPROVED so it appears in admin pending-ride-approval
            // list
            // Only admin or fleet manager can move this to APPROVED
            if (driver.getApprovalStatus() != User.ApprovalStatus.APPROVED) {
                driver.setApprovalStatus(User.ApprovalStatus.ACCOUNT_APPROVED);
            }

            driver.setLicenseNumber(request.getLicenseNumber());
            driver.setPhone(request.getPhone());
            driver.setAddress(request.getAddress());

            User savedDriver = userRepository.save(driver);
            logger.info("Driver details submitted successfully for driver ID: {}", driverId);

            return savedDriver;

        } catch (Exception e) {
            logger.error("Error in submitVehicleDetails for driver ID {}: {}", driverId, e.getMessage(), e);
            throw e; // rethrow to controller
        }
    }

    /**
     * Approve a driver - allows them to receive rides
     */
    @Transactional
    public User approveDriver(Long driverId) {
        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        if (driver.getRole() != User.Role.DRIVER) {
            throw new RuntimeException("User is not a driver");
        }

        if (!Boolean.TRUE.equals(driver.getDetailsSubmitted())) {
            throw new RuntimeException("Driver has not submitted vehicle details");
        }

        driver.setApprovalStatus(User.ApprovalStatus.APPROVED);

        // Set vehicle to AVAILABLE
        if (driver.getVehicle() != null) {
            driver.getVehicle().setStatus(Vehicle.VehicleStatus.AVAILABLE);
            vehicleRepository.save(driver.getVehicle());
        }

        return userRepository.save(driver);
    }

    /**
     * Reject a driver
     */
    @Transactional
    public User rejectDriver(Long driverId, String reason) {
        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        if (driver.getRole() != User.Role.DRIVER) {
            throw new RuntimeException("User is not a driver");
        }

        driver.setApprovalStatus(User.ApprovalStatus.REJECTED);

        // Set vehicle to OFFLINE
        if (driver.getVehicle() != null) {
            driver.getVehicle().setStatus(Vehicle.VehicleStatus.OFFLINE);
            vehicleRepository.save(driver.getVehicle());
        }

        return userRepository.save(driver);
    }

    /**
     * Get driver eligibility status with detailed reason
     */
    @Transactional(readOnly = true)
    public DriverEligibilityStatus getDriverEligibilityStatus(Long driverId) {
        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        DriverEligibilityStatus status = new DriverEligibilityStatus();
        status.setEligible(true);

        if (driver.getRole() != User.Role.DRIVER) {
            status.setEligible(false);
            status.setReason("User is not a driver");
            return status;
        }

        if (driver.getDetailsSubmitted() == null || !driver.getDetailsSubmitted()) {
            status.setEligible(false);
            status.setReason("Vehicle details not submitted. Please submit your vehicle information.");
            status.setRequiresAction("SUBMIT_DETAILS");
            return status;
        }

        if (driver.getVehicle() == null) {
            status.setEligible(false);
            status.setReason("No vehicle associated with driver");
            status.setRequiresAction("SUBMIT_DETAILS");
            return status;
        }

        if (driver.getApprovalStatus() == User.ApprovalStatus.PENDING_ACCOUNT_APPROVAL) {
            status.setEligible(false);
            status.setReason("Your account is pending admin approval");
            status.setRequiresAction("WAIT_FOR_ACCOUNT_APPROVAL");
            return status;
        }

        if (driver.getApprovalStatus() == User.ApprovalStatus.ACCOUNT_APPROVED) {
            status.setEligible(false);
            status.setReason("Your vehicle details have been submitted and are pending admin/manager approval.");
            status.setRequiresAction("WAIT_FOR_APPROVAL");
            return status;
        }

        if (driver.getApprovalStatus() == User.ApprovalStatus.REJECTED) {
            status.setEligible(false);
            status.setReason("Your driver application was rejected. Please contact support.");
            status.setRequiresAction("CONTACT_SUPPORT");
            return status;
        }

        if (driver.getApprovalStatus() == User.ApprovalStatus.SUSPENDED) {
            status.setEligible(false);
            status.setReason("Your driver account is suspended. Please contact support.");
            status.setRequiresAction("CONTACT_SUPPORT");
            return status;
        }

        if (driver.getVehicle().getStatus() != Vehicle.VehicleStatus.AVAILABLE) {
            status.setEligible(false);
            status.setReason("Vehicle is not available (Status: " + driver.getVehicle().getStatus() + ")");
            status.setRequiresAction("UPDATE_VEHICLE_STATUS");
            return status;
        }

        status.setReason("Driver is eligible to receive rides");
        return status;
    }

    private String generateVehicleCode() {
        for (int i = 0; i < 10; i++) {
            String code = "VH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            if (vehicleRepository.findByVehicleCode(code).isEmpty()) {
                return code;
            }
        }
        throw new RuntimeException("Failed to generate unique vehicle code");
    }

    private void validateVehicleDetailsRequest(VehicleDetailsRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request body is required");
        }
        if (request.getVehicleName() == null || request.getVehicleName().trim().isEmpty()) {
            throw new IllegalArgumentException("vehicleName is required");
        }
        if (request.getModel() == null || request.getModel().trim().isEmpty()) {
            throw new IllegalArgumentException("model is required");
        }
        if (request.getManufacturer() == null || request.getManufacturer().trim().isEmpty()) {
            throw new IllegalArgumentException("manufacturer is required");
        }
        if (request.getYear() == null || request.getYear() < 1990
                || request.getYear() > LocalDateTime.now().getYear() + 1) {
            throw new IllegalArgumentException("year is invalid");
        }
        if (request.getSeats() == null || request.getSeats() < 1 || request.getSeats() > 50) {
            throw new IllegalArgumentException("seats must be between 1 and 50");
        }
        if (request.getPricePerHour() == null || request.getPricePerHour().signum() <= 0) {
            throw new IllegalArgumentException("pricePerHour must be greater than 0");
        }
        if (request.getVehicleTypeEnum() == null) {
            throw new IllegalArgumentException("Invalid vehicleType: " + request.getVehicleType());
        }
        if (request.getFuelTypeEnum() == null) {
            throw new IllegalArgumentException("Invalid fuelType: " + request.getFuelType());
        }
        if (request.getLicenseNumber() == null || request.getLicenseNumber().trim().isEmpty()) {
            throw new IllegalArgumentException("licenseNumber is required");
        }
        if (request.getPhone() == null || request.getPhone().trim().isEmpty()) {
            throw new IllegalArgumentException("phone is required");
        }
        if (request.getAddress() == null || request.getAddress().trim().isEmpty()) {
            throw new IllegalArgumentException("address is required");
        }
    }

    // ===================== Response Class =====================

    public static class DriverEligibilityStatus {
        private boolean eligible;
        private String reason;
        private String requiresAction;

        public boolean isEligible() {
            return eligible;
        }

        public void setEligible(boolean eligible) {
            this.eligible = eligible;
        }

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }

        public String getRequiresAction() {
            return requiresAction;
        }

        public void setRequiresAction(String requiresAction) {
            this.requiresAction = requiresAction;
        }
    }
}
