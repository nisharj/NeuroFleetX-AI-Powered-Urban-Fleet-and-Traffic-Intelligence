package com.neurofleetx.controller;

import com.neurofleetx.dto.AdminStatsDTO;
import com.neurofleetx.dto.HeatmapDTO;
import com.neurofleetx.dto.RevenueChartDTO;
import com.neurofleetx.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AnalyticsController {
    
    private final AnalyticsService analyticsService;
    
    @GetMapping("/revenue")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    public ResponseEntity<RevenueChartDTO> getRevenueData(
        @RequestParam(defaultValue = "week") String timeRange
    ) {
        RevenueChartDTO data = analyticsService.getRevenueData(timeRange);
        return ResponseEntity.ok(data);
    }
    
    @GetMapping("/heatmap")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    public ResponseEntity<HeatmapDTO> getHeatmapData(
        @RequestParam(defaultValue = "week") String timeRange
    ) {
        HeatmapDTO data = analyticsService.getHeatmapData(timeRange);
        return ResponseEntity.ok(data);
    }
    
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    public ResponseEntity<AdminStatsDTO> getAdminStats(
        @RequestParam(defaultValue = "week") String timeRange
    ) {
        AdminStatsDTO stats = analyticsService.getAdminStats(timeRange);
        return ResponseEntity.ok(stats);
    }
}
