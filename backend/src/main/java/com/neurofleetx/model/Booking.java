package com.neurofleetx.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_code", unique = true, nullable = false, length = 20)
    private String bookingCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = true)
    private Vehicle vehicle;

    @Column(name = "requested_vehicle_type")
    private String requestedVehicleType;

    @Column(name = "pickup_time", nullable = false)
    private LocalDateTime pickupTime;

    @Column(name = "return_time", nullable = true)
    private LocalDateTime returnTime;

    @Column(name = "actual_return_time")
    private LocalDateTime actualReturnTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pickup_city_id")
    private City pickupCity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "return_city_id")
    private City returnCity;

    @Column(name = "pickup_latitude", precision = 10, scale = 8)
    private BigDecimal pickupLatitude;

    @Column(name = "pickup_longitude", precision = 11, scale = 8)
    private BigDecimal pickupLongitude;

    @Column(name = "return_latitude", precision = 10, scale = 8)
    private BigDecimal returnLatitude;

    @Column(name = "return_longitude", precision = 11, scale = 8)
    private BigDecimal returnLongitude;

    @Column(name = "pickup_address", columnDefinition = "TEXT")
    private String pickupAddress;

    @Column(name = "drop_address", columnDefinition = "TEXT")
    private String dropAddress;

    @Column(name = "passenger_count")
    private Integer passengerCount;

    @Column(name = "contact_number", length = 20)
    private String contactNumber;

    @Column(name = "booking_type", length = 20)
    private String bookingType;

    @Column(name = "hourly_rate", precision = 10, scale = 2, nullable = false)
    private BigDecimal hourlyRate;

    @Column(name = "estimated_hours", precision = 10, scale = 2, nullable = false)
    private BigDecimal estimatedHours;

    @Column(name = "estimated_cost", precision = 10, scale = 2, nullable = false)
    private BigDecimal estimatedCost;

    @Column(name = "actual_cost", precision = 10, scale = 2)
    private BigDecimal actualCost;

    @Column(name = "discount_amount", precision = 10, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "tax_amount", precision = 10, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "base_fare", precision = 10, scale = 2)
    private BigDecimal baseFare = BigDecimal.ZERO;

    @Column(name = "distance_km", precision = 10, scale = 2)
    private BigDecimal distanceKm = BigDecimal.ZERO;

    @Column(name = "rate_per_km", precision = 10, scale = 2)
    private BigDecimal ratePerKm = BigDecimal.ZERO;

    @Column(name = "total_cost", precision = 10, scale = 2, nullable = false)
    private BigDecimal totalCost;

    // DRIVER ASSIGNMENT & LIFECYCLE
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    private User driver;

    @Column(name = "broadcasted_at")
    private LocalDateTime broadcastedAt;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Column(name = "arrived_at")
    private LocalDateTime arrivedAt;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancelled_by", length = 50)
    private String cancelledBy;

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    @Version
    private Long version;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status = BookingStatus.PENDING;


    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Column(name = "customer_rating")
    private Integer customerRating;

    @Column(name = "customer_feedback", columnDefinition = "TEXT")
    private String customerFeedback;

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

    public enum BookingStatus {
        PENDING,
        BROADCASTED,
        ACCEPTED,
        ARRIVED,
        IN_PROGRESS,
        STARTED,
        COMPLETED,

        CANCELLED_BY_CUSTOMER,
        CANCELLED_BY_DRIVER,
        CANCELLED_BY_ADMIN,
        EXPIRED, 
        CONFIRMED
    }


    public enum PaymentStatus {
        PENDING, PAID, REFUNDED, FAILED
    }

}
