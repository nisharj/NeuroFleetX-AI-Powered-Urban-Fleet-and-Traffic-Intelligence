package com.neurofleetx.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RevenueChartDTO {
    private List<DataPoint> data;
    private BigDecimal totalRevenue;
    private BigDecimal averageRevenue;
    private BigDecimal peakRevenue;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DataPoint {
        private String label; // hour, day, week, or month
        private BigDecimal revenue;
    }
}
