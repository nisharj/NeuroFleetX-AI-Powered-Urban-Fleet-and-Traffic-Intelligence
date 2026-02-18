package com.neurofleetx.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RouteOptionDTO {
    private BigDecimal distance; // in kilometers
    private BigDecimal duration; // in minutes
    private BigDecimal score;
    private List<List<Double>> geometry; // [[lng, lat], [lng, lat], ...]
    private String summary;
    private boolean isBestRoute;
}
