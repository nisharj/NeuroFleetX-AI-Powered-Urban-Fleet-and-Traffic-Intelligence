package com.neurofleetx.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Comprehensive DTO for complete ride lifecycle
 * Used for all API responses and WebSocket events
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RideLifecycleDTO {

    // Booking identifiers
    private Long bookingId;
    private String bookingCode;

    // Customer info
    private Long customerId;
    private String customerName;
    private String customerPhone;

    // Driver info (null until ACCEPTED)
    private Long driverId;
    private String driverName;
    private String driverPhone;
    private String vehicleType;
    private String vehicleNumber;
    private String vehicleColor;

    // Location info
    private String pickupAddress;
    private Double pickupLat;
    private Double pickupLng;
    private String dropAddress;
    private Double dropLat;
    private Double dropLng;

    // Fare & Distance
    private BigDecimal fare;
    private BigDecimal distance;
    private BigDecimal duration; // in minutes
    private String currency; // INR, USD, etc

    // Ride status
    private String status; // PENDING, ACCEPTED, ONGOING, COMPLETED, CANCELLED
    private String cancelledBy; // CUSTOMER, DRIVER, ADMIN
    private String cancellationReason;

    // Passenger info
    private Integer passengerCount;
    private String contactNumber;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime cancelledAt;

    // Ratings & Feedback
    private Integer customerRating;
    private String customerFeedback;
    private Integer driverRating;
    private String driverFeedback;

    // OTP for verification
    private String pickupOtp;
    private Boolean pickupVerified;

    // WebSocket/Real-time tracking
    private Double currentLat;
    private Double currentLng;
    private Integer etaMinutes;
}
