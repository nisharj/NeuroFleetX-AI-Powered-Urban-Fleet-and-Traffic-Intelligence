package com.neurofleetx.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsDTO {
    private BigDecimal totalRevenue;
    private Integer totalBookings;
    private Integer activeVehicles;
    private Integer totalCustomers;
    private BigDecimal revenueGrowth; // percentage
    private BigDecimal bookingGrowth; // percentage
    private BigDecimal fleetUtilization; // percentage
    private BigDecimal customerGrowth; // percentage
}
