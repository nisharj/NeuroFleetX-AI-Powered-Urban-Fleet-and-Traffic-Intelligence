package com.neurofleetx.repository;

import com.neurofleetx.model.Vehicle;
import com.neurofleetx.model.Vehicle.VehicleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    Optional<Vehicle> findByVehicleCode(String vehicleCode);

    List<Vehicle> findByStatus(VehicleStatus status);

    List<Vehicle> findByCurrentCity_IdAndStatus(Long cityId, VehicleStatus status);

    List<Vehicle> findByType(Vehicle.VehicleType type);

    List<Vehicle> findByCurrentCity_Name(String cityName);

    /**
     * ✅ Find vehicles that are AVAILABLE and not already booked in the given time range.
     *
     * Booking status blocking rules:
     * - ACCEPTED / ARRIVED / STARTED  => vehicle is locked (ride-hailing)
     * - CONFIRMED => vehicle is locked (rental)
     */
    @Query("""
        SELECT v FROM Vehicle v
        WHERE v.status = 'AVAILABLE'
        AND v.id NOT IN (
            SELECT b.vehicle.id FROM Booking b
            WHERE b.vehicle IS NOT NULL
            AND b.status IN ('CONFIRMED','ACCEPTED','ARRIVED','STARTED')
            AND (b.pickupTime <= :endTime AND b.returnTime >= :startTime)
        )
    """)
    List<Vehicle> findAvailableVehicles(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    /**
     * ✅ Find available vehicles in a city for a specific time range
     */
    @Query("""
        SELECT v FROM Vehicle v
        WHERE v.status = 'AVAILABLE'
        AND v.currentCity.id = :cityId
        AND v.id NOT IN (
            SELECT b.vehicle.id FROM Booking b
            WHERE b.vehicle IS NOT NULL
            AND b.status IN ('CONFIRMED','ACCEPTED','ARRIVED','STARTED')
            AND (b.pickupTime <= :endTime AND b.returnTime >= :startTime)
        )
    """)
    List<Vehicle> findAvailableVehiclesByCity(
            @Param("cityId") Long cityId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    /**
     * ✅ AI recommended vehicles (only AVAILABLE ones)
     */
    @Query("""
        SELECT v FROM Vehicle v
        WHERE v.status = 'AVAILABLE'
        ORDER BY v.aiScore DESC
    """)
    List<Vehicle> findTopRecommendedVehicles();

    @Query("SELECT COUNT(v) FROM Vehicle v WHERE v.status = :status")
    Long countByStatus(@Param("status") VehicleStatus status);

 
    @Query("""
        SELECT v FROM Vehicle v
        WHERE v.status = 'MAINTENANCE'
        OR v.engineHealth < 80
        OR v.tireHealth < 80
        OR v.brakeHealth < 80
    """)
    List<Vehicle> findVehiclesNeedingMaintenance();

}
