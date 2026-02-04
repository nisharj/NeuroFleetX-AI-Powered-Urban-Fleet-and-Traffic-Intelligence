package com.neurofleetx.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateBookingRequest {
    // Optional: null for ride-hailing (vehicle assigned later), required for rental
    private Long vehicleId;

    @NotNull(message = "Pickup time is required")
    // Removed @Future to allow immediate "now" bookings
    private LocalDateTime pickupTime;

    private LocalDateTime returnTime;

    private Long pickupCityId;
    private Long returnCityId;

    // New fields for enhanced booking
    @NotBlank(message = "Pickup address is required")
    private String pickupAddress;

    @NotBlank(message = "Drop address is required")
    private String dropAddress;

    @Min(value = 1, message = "At least 1 passenger is required")
    private Integer passengerCount;

    @NotBlank(message = "Vehicle type is required")
    private String vehicleType;

    @NotBlank(message = "Contact number is required")
    private String contactNumber;

    private String bookingType; // "now" or "schedule"
    private Double pickupLatitude;
    private Double pickupLongitude;
    private Double returnLatitude;
    private Double returnLongitude;
}
