package com.neurofleetx.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DriverVerificationRequest {

    // License Information
    private String licenseNumber;
    private LocalDate licenseExpiryDate;
    private String licenseState;
    private String licenseCountry;

    // Vehicle Information
    private String vehicleMake;
    private String vehicleModel;
    private Integer vehicleYear;
    private String vehicleColor;
    private String vehiclePlateNumber;
    private String vehicleType;
    private Integer vehicleCapacity;

    // Insurance Information
    private String insuranceCompany;
    private String insurancePolicyNumber;
    private LocalDate insuranceExpiryDate;

    // Documents (URLs or paths)
    private String licenseDocumentUrl;
    private String vehicleRcDocumentUrl;
    private String insuranceDocumentUrl;
    private String photoUrl;

    // Additional Information
    private Integer experienceYears;
    private String emergencyContactName;
    private String emergencyContactNumber;
    private String notes;
}
