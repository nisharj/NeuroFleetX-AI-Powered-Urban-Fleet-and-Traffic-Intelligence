package com.neurofleetx.repository;

import com.neurofleetx.model.Booking;
import com.neurofleetx.model.Booking.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    // =========================
    // BASIC LOOKUPS
    // =========================

    Optional<Booking> findByBookingCode(String bookingCode);

    List<Booking> findByUserId(Long userId);

    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Booking> findByVehicleId(Long vehicleId);

    List<Booking> findByVehicleIdAndStatusInOrderByCreatedAtDesc(
            Long vehicleId,
            List<BookingStatus> statuses);

    boolean existsByVehicleIdAndStatusIn(Long vehicleId, List<BookingStatus> statuses);

    List<Booking> findByStatus(BookingStatus status);

    @Query("""
                SELECT b FROM Booking b
                WHERE b.user.id = :userId
                AND b.status = :status
            """)
    List<Booking> findByUserIdAndStatus(
            @Param("userId") Long userId,
            @Param("status") BookingStatus status);

    // =========================
    // RENTAL: VEHICLE CONFLICT CHECK
    // =========================
    // Block if booking is in active statuses
    // CONFIRMED (rental locked)
    // ACCEPTED/ARRIVED/STARTED (ride-hailing active)
    @Query("""
                SELECT b FROM Booking b
                WHERE b.vehicle.id = :vehicleId
                AND b.status IN ('CONFIRMED','ACCEPTED','ARRIVED','STARTED')
                AND (b.pickupTime <= :endTime AND b.returnTime >= :startTime)
            """)
    List<Booking> findConflictingBookings(
            @Param("vehicleId") Long vehicleId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    // =========================
    // DASHBOARD COUNTS
    // =========================

    @Query("""
                SELECT COUNT(b) FROM Booking b
                WHERE b.createdAt >= :startDate
                AND b.createdAt < :endDate
            """)
    Long countBookingsBetweenDates(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("""
                SELECT SUM(b.totalCost) FROM Booking b
                WHERE b.status = 'COMPLETED'
                AND b.createdAt >= :startDate
                AND b.createdAt < :endDate
            """)
    BigDecimalWrapper getTotalRevenueBetweenDates(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    // ✅ Fix BigDecimal return type without nullable crash
    interface BigDecimalWrapper {
        java.math.BigDecimal getTotalCost();
    }

    // =========================
    // RIDE HAILING: DRIVER PENDING REQUESTS
    // =========================

    /**
     * ✅ Pending ride requests for drivers
     * status must be BROADCASTED and booking has no vehicle assigned.
     */
    @Query("""
                SELECT b FROM Booking b
                WHERE b.status = 'BROADCASTED'
                AND b.vehicle IS NULL
                ORDER BY b.createdAt DESC
            """)
    List<Booking> findPendingRideRequests();

    /**
     * ✅ Pending ride requests filtered by vehicle type
     */
    List<Booking> findByStatusAndRequestedVehicleType(BookingStatus status, String requestedVehicleType);

    // =========================
    // DRIVER RIDE LIFECYCLE QUERIES
    // =========================

    @Query("""
                SELECT b FROM Booking b
                WHERE b.driver.id = :driverId
                AND b.status IN :statuses
                ORDER BY b.createdAt DESC
            """)
    List<Booking> findByDriverIdAndStatusIn(
            @Param("driverId") Long driverId,
            @Param("statuses") List<Booking.BookingStatus> statuses);

    @Query("""
                SELECT b FROM Booking b
                WHERE b.driver.id = :driverId
                AND b.status IN ('CONFIRMED','ACCEPTED','ARRIVED','STARTED','IN_PROGRESS')
                ORDER BY b.createdAt DESC
            """)
    Optional<Booking> findActiveRideForDriver(@Param("driverId") Long driverId);

    @Query("""
                SELECT b FROM Booking b
                WHERE b.user.id = :customerId
                AND b.status IN ('BROADCASTED','ACCEPTED','ARRIVED','STARTED')
            """)
    Optional<Booking> findActiveRideForCustomer(@Param("customerId") Long customerId);

    @Query("""
                SELECT b FROM Booking b
                WHERE b.user.id = :customerId
                AND b.status = 'COMPLETED'
                ORDER BY b.completedAt DESC
            """)
    List<Booking> findCustomerCompletedRides(@Param("customerId") Long customerId);

    @Query("""
                SELECT b FROM Booking b
                WHERE b.driver.id = :driverId
                AND b.status = 'COMPLETED'
                ORDER BY b.completedAt DESC
            """)
    List<Booking> findDriverCompletedRides(@Param("driverId") Long driverId);

    @Query("""
                SELECT b FROM Booking b
                WHERE b.status IN ('BROADCASTED','ACCEPTED','ARRIVED')
                AND b.startedAt IS NULL
                AND b.pickupTime <= :cutoff
            """)
    List<Booking> findBookingsToExpire(@Param("cutoff") LocalDateTime cutoff);

    @Query("""
                SELECT COUNT(b) FROM Booking b
                WHERE b.driver.id = :driverId
                AND b.status = 'COMPLETED'
            """)
    Long countCompletedRidesByDriver(@Param("driverId") Long driverId);

    @Query("""
                SELECT AVG(b.customerRating) FROM Booking b
                WHERE b.driver.id = :driverId
                AND b.status = 'COMPLETED'
                AND b.customerRating IS NOT NULL
            """)
    Double findAverageDriverRating(@Param("driverId") Long driverId);

    @Query("""
                SELECT COUNT(b) FROM Booking b
                WHERE b.driver.id = :driverId
                AND b.customerRating IS NOT NULL
            """)
    Long countDriverRatings(@Param("driverId") Long driverId);

}
