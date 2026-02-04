package com.neurofleetx.service;

import com.neurofleetx.model.Vehicle;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class VehicleDetailsRequest {

    private String vehicleName;
    private String vehicleType;
    private String model;
    private String manufacturer;
    private Integer year;
    private Integer seats;
    private String fuelType;
    private BigDecimal pricePerHour;
    private String licensePlate;
    private Integer batteryLevel;
    private String licenseNumber;
    private String phone;
    private String address;

    /**
     * Converts frontend vehicleType values into backend enum Vehicle.VehicleType
     *
     * Frontend values:
     * BIKE, AUTO, SUV, SEDAN, ELECTRICAL_VEHICLE
     *
     * Backend enum:
     * EV, SEDAN, SUV, AUTO, BIKE
     */
    public Vehicle.VehicleType getVehicleTypeEnum() {
        if (vehicleType == null) return null;

        String normalized = vehicleType.trim().toUpperCase();

        // ✅ Fix frontend naming
        if (normalized.equals("ELECTRICAL_VEHICLE") || normalized.equals("ELECTRIC_VEHICLE")) {
            return Vehicle.VehicleType.ELECTRICAL_VEHICLE;
        }

        try {
            return Vehicle.VehicleType.valueOf(normalized);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Converts frontend fuelType values into backend enum Vehicle.FuelType
     *
     * Frontend values:
     * Electric, Petrol, Diesel, Hybrid
     *
     * Backend enum:
     * ELECTRIC, PETROL, DIESEL, HYBRID
     */
    public Vehicle.FuelType getFuelTypeEnum() {
        if (fuelType == null) return null;

        String normalized = fuelType.trim().toUpperCase();

        try {
            return Vehicle.FuelType.valueOf(normalized);
        } catch (Exception e) {
            return null;
        }
    }
}
