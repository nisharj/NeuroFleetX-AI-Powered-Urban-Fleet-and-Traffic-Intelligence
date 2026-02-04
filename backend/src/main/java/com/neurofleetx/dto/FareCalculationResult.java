package com.neurofleetx.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FareCalculationResult {
    private BigDecimal distanceKm;
    private BigDecimal estimatedCost;
    private BigDecimal baseFare;
    private BigDecimal ratePerKm;
    private String routeDetails; 
}
