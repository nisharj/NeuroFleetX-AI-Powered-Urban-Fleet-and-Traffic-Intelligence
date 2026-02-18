package com.neurofleetx.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DriverAssignmentDTO {
    private Long driverId;
    private String driverName;
    private String driverEmail;
    private String driverPhone;
    private BigDecimal distanceToPickup; // in km
    private Integer activeRidesCount;
    private BigDecimal assignmentScore;
    private VehicleInfoDTO vehicle;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VehicleInfoDTO {
        private Long vehicleId;
        private String vehicleType;
        private String vehicleName;
        private String vehicleModel;
        private String plateNumber;
        private Integer seats;
    }
}
