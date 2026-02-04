package com.neurofleetx.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VehicleDTO {
    private Long id;
    private String vehicleCode;
    private String name;
    private String type;
    private String model;
    private Integer seats;
    private String fuelType;
    private String location;
    private Long cityId;
    private BigDecimal pricePerHour;
    private BigDecimal rating;
    private Integer batteryLevel;
    private List<String> features;
    private Boolean aiRecommended;
    private String status;
}
