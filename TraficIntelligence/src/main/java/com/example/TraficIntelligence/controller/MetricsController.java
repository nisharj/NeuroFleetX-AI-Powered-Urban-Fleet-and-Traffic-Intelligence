package com.example.TraficIntelligence.controller;

// import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

// @CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api")
public class MetricsController {

    @GetMapping("/admin/metrics")
    public Map<String, Integer> adminMetrics() {
        return Map.of(
            "bookings", 128,
            "fleet", 42,
            "users", 356
        );
    }

    @GetMapping("/fleet/metrics")
    public Map<String, Integer> fleetMetrics() {
        return Map.of(
            "vehicles", 42,
            "drivers", 18,
            "maintenance", 5
        );
    }

    @GetMapping("/driver/metrics")
    public Map<String, Integer> driverMetrics() {
        return Map.of(
            "todayTrips", 6,
            "totalTrips", 248,
            "rating", 5
        );
    }

    @GetMapping("/customer/metrics")
    public Map<String, Integer> customerMetrics() {
        return Map.of(
            "bookings", 12,
            "activeTrips", 1,
            "wallet", 850
        );
    }
}
