package com.neurofleetx.controller;

import com.neurofleetx.dto.DriverVerificationRequest;
import com.neurofleetx.dto.MessageResponse;
import com.neurofleetx.model.DriverVerification;
import com.neurofleetx.model.User;
import com.neurofleetx.repository.DriverVerificationRepository;
import com.neurofleetx.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/driver")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DriverVerificationController {

    private static final Logger logger = LoggerFactory.getLogger(DriverVerificationController.class);

    @Autowired
    private DriverVerificationRepository verificationRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Get driver's verification status and details
     */
    @GetMapping("/verification/status")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<?> getVerificationStatus(Authentication authentication) {
        try {
            String email = authentication.getName();
            User driver = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Driver not found"));

            var verification = verificationRepository.findByDriverId(driver.getId());

            if (verification.isEmpty()) {
                // No verification record exists yet
                return ResponseEntity.ok(Map.of(
                        "exists", false,
                        "status", "PENDING_SUBMISSION",
                        "message", "Please submit your verification details"));
            }

            return ResponseEntity.ok(Map.of(
                    "exists", true,
                    "verification", verification.get()));
        } catch (Exception e) {
            logger.error("Error fetching verification status: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    /**
     * Submit driver verification details
     */
    @PostMapping("/verification/submit")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<?> submitVerification(
            @RequestBody DriverVerificationRequest request,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            User driver = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Driver not found"));

            logger.info("Driver {} submitting verification details", driver.getName());

            // Check if verification already exists
            DriverVerification verification = verificationRepository.findByDriverId(driver.getId())
                    .orElse(new DriverVerification());

            // Update verification details
            verification.setDriver(driver);
            verification.setLicenseNumber(request.getLicenseNumber());
            verification.setLicenseExpiryDate(request.getLicenseExpiryDate());
            verification.setLicenseState(request.getLicenseState());
            verification.setLicenseCountry(request.getLicenseCountry());

            verification.setVehicleMake(request.getVehicleMake());
            verification.setVehicleModel(request.getVehicleModel());
            verification.setVehicleYear(request.getVehicleYear());
            verification.setVehicleColor(request.getVehicleColor());
            verification.setVehiclePlateNumber(request.getVehiclePlateNumber());
            verification.setVehicleType(request.getVehicleType());
            verification.setVehicleCapacity(request.getVehicleCapacity());

            verification.setInsuranceCompany(request.getInsuranceCompany());
            verification.setInsurancePolicyNumber(request.getInsurancePolicyNumber());
            verification.setInsuranceExpiryDate(request.getInsuranceExpiryDate());

            verification.setLicenseDocumentUrl(request.getLicenseDocumentUrl());
            verification.setVehicleRcDocumentUrl(request.getVehicleRcDocumentUrl());
            verification.setInsuranceDocumentUrl(request.getInsuranceDocumentUrl());
            verification.setPhotoUrl(request.getPhotoUrl());

            verification.setExperienceYears(request.getExperienceYears());
            verification.setEmergencyContactName(request.getEmergencyContactName());
            verification.setEmergencyContactNumber(request.getEmergencyContactNumber());
            verification.setNotes(request.getNotes());

            verification.setVerificationStatus(DriverVerification.VerificationStatus.PENDING_APPROVAL);

            verificationRepository.save(verification);

            // Mark that driver has submitted details (but don't change account approval
            // status)
            driver.setDetailsSubmitted(true);
            userRepository.save(driver);

            logger.info("Verification submitted successfully for driver {}", driver.getName());

            return ResponseEntity.ok(Map.of(
                    "message", "Verification details submitted successfully. Waiting for admin approval.",
                    "verification", verification));
        } catch (Exception e) {
            logger.error("Error submitting verification: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    /**
     * Get all pending driver verifications (Admin only)
     */
    @GetMapping("/verification/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getPendingVerifications() {
        try {
            List<DriverVerification> pending = verificationRepository
                    .findByVerificationStatus(DriverVerification.VerificationStatus.PENDING_APPROVAL);

            logger.info("Found {} pending driver verifications", pending.size());
            return ResponseEntity.ok(pending);
        } catch (Exception e) {
            logger.error("Error fetching pending verifications: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    /**
     * Get all driver verifications (Admin only)
     */
    @GetMapping("/verification/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllVerifications() {
        try {
            List<DriverVerification> verifications = verificationRepository.findAll();
            logger.info("Found {} total driver verifications", verifications.size());
            return ResponseEntity.ok(verifications);
        } catch (Exception e) {
            logger.error("Error fetching verifications: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    /**
     * Approve driver verification (Admin only)
     */
    @PostMapping("/verification/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> approveVerification(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> requestBody,
            Authentication authentication) {
        try {
            DriverVerification verification = verificationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Verification not found"));

            User admin = userRepository.findByEmail(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("Admin not found"));

            verification.setVerificationStatus(DriverVerification.VerificationStatus.APPROVED);
            verification.setApprovedById(admin.getId());
            verification.setApprovedAt(LocalDateTime.now());

            if (requestBody != null && requestBody.containsKey("remarks")) {
                verification.setAdminRemarks(requestBody.get("remarks"));
            }

            verificationRepository.save(verification);

            // Driver's account status remains ACCOUNT_APPROVED (Phase 1)
            // Only the ride eligibility (Phase 2) is now approved
            User driver = verification.getDriver();

            logger.info("Driver verification approved: {} by admin {}",
                    driver.getName(), admin.getName());

            return ResponseEntity.ok(Map.of(
                    "message", "Driver " + driver.getName() + " has been approved successfully",
                    "verification", verification));
        } catch (Exception e) {
            logger.error("Error approving verification: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    /**
     * Reject driver verification (Admin only)
     */
    @PostMapping("/verification/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> rejectVerification(
            @PathVariable Long id,
            @RequestBody Map<String, String> requestBody,
            Authentication authentication) {
        try {
            DriverVerification verification = verificationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Verification not found"));

            User admin = userRepository.findByEmail(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("Admin not found"));

            String reason = requestBody.getOrDefault("reason", "No reason provided");

            verification.setVerificationStatus(DriverVerification.VerificationStatus.REJECTED);
            verification.setRejectedAt(LocalDateTime.now());
            verification.setAdminRemarks(reason);
            verificationRepository.save(verification);

            // Driver's account status remains unchanged - they can resubmit verification
            User driver = verification.getDriver();

            logger.info("Driver verification rejected: {} by admin {}. Reason: {}",
                    driver.getName(), admin.getName(), reason);

            return ResponseEntity.ok(Map.of(
                    "message", "Driver verification has been rejected. Reason: " + reason,
                    "verification", verification));
        } catch (Exception e) {
            logger.error("Error rejecting verification: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }
}
