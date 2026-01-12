package com.example.TraficIntelligence.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api")
public class MetricsController {

    @GetMapping("/admin/metrics")
    public Map<String, Integer> adminMetrics() {
        return Map.of(
            "totalUsers", 356,
            "totalVehicles", 42,
            "activeFleets", 8,
            "todayBookings", 27
        );
    }

    @GetMapping("/fleet/metrics")
    public Map<String, Integer> fleetMetrics() {
        return Map.of(
            "totalVehicles", 42,
            "vehiclesInUse", 30,
            "vehiclesUnderMaintenance", 5
        );
    }

    @GetMapping("/driver/metrics")
    public Map<String, Integer> driverMetrics() {
        return Map.of(
            "assignedTrips", 3,
            "completedTrips", 248,
            "vehicleStatus", 1
        );
    }

    @GetMapping("/customer/metrics")
    public Map<String, Integer> customerMetrics() {
        return Map.of(
             "totalBookings", 12,
            "activeBooking", 1,
            "rideHistoryCount", 11
        );
    }
}
