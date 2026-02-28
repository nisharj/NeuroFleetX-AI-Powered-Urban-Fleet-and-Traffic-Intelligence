package com.neurofleetx.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FleetVehicleDTO {
    private Long id;
    private String vehicleCode;
    private String vehicleNumber;
    private String name;
    private String type;
    private String model;
    private Integer year;
    private Integer seats;
    private String fuelType;

    private String status;
    private boolean lockedForRide;

    private BigDecimal currentLatitude;
    private BigDecimal currentLongitude;
    private String currentCityName;

    private Integer batteryLevel;
    private Integer mileage;
    private Integer engineHealth;
    private Integer tireHealth;
    private Integer brakeHealth;
    private LocalDateTime lastMaintenanceDate;
    private LocalDateTime nextMaintenanceDate;
    private String healthStatus;
    private List<String> healthAlerts;

    private BigDecimal rating;
    private Integer totalRatings;

    private DriverSummary assignedDriver;
    private CurrentTrip currentTrip;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DriverSummary {
        private Long id;
        private String name;
        private String email;
        private String phone;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CurrentTrip {
        private Long bookingId;
        private String bookingCode;
        private String pickupLocation;
        private String dropLocation;
        private Long passengerId;
        private String passengerName;
        private String passengerPhone;
        private LocalDateTime rideStartTime;
        private String rideStatus;
    }
}
