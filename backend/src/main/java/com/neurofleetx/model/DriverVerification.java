package com.neurofleetx.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "driver_verifications")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DriverVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "driver_id", nullable = false, unique = true)
    private User driver;

    // License Information
    @Column(name = "license_number", nullable = false, length = 100)
    private String licenseNumber;

    @Column(name = "license_expiry_date")
    private LocalDate licenseExpiryDate;

    @Column(name = "license_state", length = 100)
    private String licenseState;

    @Column(name = "license_country", length = 100)
    private String licenseCountry = "India";

    // Vehicle Information
    @Column(name = "vehicle_make", length = 100)
    private String vehicleMake;

    @Column(name = "vehicle_model", length = 100)
    private String vehicleModel;

    @Column(name = "vehicle_year")
    private Integer vehicleYear;

    @Column(name = "vehicle_color", length = 50)
    private String vehicleColor;

    @Column(name = "vehicle_plate_number", length = 50)
    private String vehiclePlateNumber;

    @Column(name = "vehicle_type", length = 50)
    private String vehicleType; // SEDAN, SUV, HATCHBACK, etc.

    @Column(name = "vehicle_capacity")
    private Integer vehicleCapacity;

    // Insurance Information
    @Column(name = "insurance_company", length = 200)
    private String insuranceCompany;

    @Column(name = "insurance_policy_number", length = 100)
    private String insurancePolicyNumber;

    @Column(name = "insurance_expiry_date")
    private LocalDate insuranceExpiryDate;

    // Documents (file paths or URLs)
    @Column(name = "license_document_url", length = 500)
    private String licenseDocumentUrl;

    @Column(name = "vehicle_rc_document_url", length = 500)
    private String vehicleRcDocumentUrl;

    @Column(name = "insurance_document_url", length = 500)
    private String insuranceDocumentUrl;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    // Additional Information
    @Column(name = "experience_years")
    private Integer experienceYears;

    @Column(name = "emergency_contact_name", length = 100)
    private String emergencyContactName;

    @Column(name = "emergency_contact_number", length = 20)
    private String emergencyContactNumber;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    // Verification Status
    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false, length = 50)
    private VerificationStatus verificationStatus = VerificationStatus.PENDING_SUBMISSION;

    @Column(name = "admin_remarks", columnDefinition = "TEXT")
    private String adminRemarks;

    @Column(name = "approved_by_id")
    private Long approvedById;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum VerificationStatus {
        PENDING_SUBMISSION, // Initial state, waiting for driver to submit details
        PENDING_APPROVAL, // Details submitted, waiting for admin review
        APPROVED, // Approved by admin
        REJECTED, // Rejected by admin
        RESUBMISSION_REQUIRED // Admin requested changes
    }
}
