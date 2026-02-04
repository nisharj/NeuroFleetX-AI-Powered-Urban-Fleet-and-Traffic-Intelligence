package com.neurofleetx.dto;

import lombok.Data;

@Data
public class DriverDetailsDTO {

    private String address;
    private String licenseNumber;
    private String phone;

    private String vehicleName;
    private String vehicleType;

    private String model;          
    private String manufacturer;   

    private Integer year;         
    private Integer seats;        

    private String fuelType;     
    private Double pricePerHour;   

    private String licensePlate;   

    private Integer batteryLevel;  
}
