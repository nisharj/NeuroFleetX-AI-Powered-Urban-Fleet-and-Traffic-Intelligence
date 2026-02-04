package com.neurofleetx.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HeatmapDTO {
    private List<CityData> cities;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CityData {
        private Long id;
        private String name;
        private Integer trips;
        private Double latitude;
        private Double longitude;
        private Double percentage;
    }
}
