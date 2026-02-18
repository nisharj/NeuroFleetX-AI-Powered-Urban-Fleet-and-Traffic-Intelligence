package com.neurofleetx.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RouteOptimizationResponse {
    private RouteOptionDTO bestRoute;
    private List<RouteOptionDTO> alternateRoutes;
    private BigDecimal estimatedTimeArrival; // ETA in minutes
    private BigDecimal totalDistance; // in kilometers
    private PickupDropLocation pickup;
    private PickupDropLocation drop;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PickupDropLocation {
        private Double latitude;
        private Double longitude;
        private String address;
    }
}
