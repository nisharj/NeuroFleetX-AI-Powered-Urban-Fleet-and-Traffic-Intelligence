package com.neurofleetx.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "analytics_daily")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsDaily {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private LocalDate date;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "city_id")
    private City city;
    
    @Column(name = "total_revenue", precision = 12, scale = 2)
    private BigDecimal totalRevenue = BigDecimal.ZERO;
    
    @Column(name = "total_bookings")
    private Integer totalBookings = 0;
    
    @Column(name = "completed_bookings")
    private Integer completedBookings = 0;
    
    @Column(name = "cancelled_bookings")
    private Integer cancelledBookings = 0;
    
    @Column(name = "total_vehicles")
    private Integer totalVehicles = 0;
    
    @Column(name = "active_vehicles")
    private Integer activeVehicles = 0;
    
    @Column(name = "vehicles_in_use")
    private Integer vehiclesInUse = 0;
    
    @Column(name = "vehicles_in_maintenance")
    private Integer vehiclesInMaintenance = 0;
    
    @Column(name = "new_customers")
    private Integer newCustomers = 0;
    
    @Column(name = "returning_customers")
    private Integer returningCustomers = 0;
    
    @Column(name = "average_booking_duration", precision = 10, scale = 2)
    private BigDecimal averageBookingDuration = BigDecimal.ZERO;
    
    @Column(name = "average_revenue_per_booking", precision = 10, scale = 2)
    private BigDecimal averageRevenuePerBooking = BigDecimal.ZERO;
    
    @Column(name = "fleet_utilization_rate", precision = 5, scale = 2)
    private BigDecimal fleetUtilizationRate = BigDecimal.ZERO;
    
    @Column(name = "total_trips")
    private Integer totalTrips = 0;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
