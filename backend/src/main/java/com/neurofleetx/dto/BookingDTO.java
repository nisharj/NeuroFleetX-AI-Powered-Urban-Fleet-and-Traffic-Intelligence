package com.neurofleetx.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingDTO {
    private Long id;
    private String bookingCode;
    private Long userId;
    private Long vehicleId;
    private String vehicleName;
    private LocalDateTime pickupTime;
    private LocalDateTime returnTime;
    private BigDecimal hourlyRate;
    private BigDecimal estimatedHours;
    private BigDecimal totalCost;
    private BigDecimal baseFare;
    private BigDecimal distanceKm;
    private BigDecimal ratePerKm;
    private String status;
    private String paymentStatus;
    private String requestedVehicleType;
    private String pickupAddress;
    private String dropAddress;
    private LocalDateTime createdAt;
    // Driver and lifecycle timestamps
    private Long driverId;
    private String driverName;
    private LocalDateTime broadcastedAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime arrivedAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime cancelledAt;
    private String cancelledBy;
    private String cancellationReason;

    // Latency in milliseconds between broadcast and acceptance
    private Long acceptLatencyMs;
}
