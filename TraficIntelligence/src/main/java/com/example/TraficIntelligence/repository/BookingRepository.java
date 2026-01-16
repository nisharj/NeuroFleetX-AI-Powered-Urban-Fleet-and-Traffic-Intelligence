package com.example.TraficIntelligence.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.TraficIntelligence.model.BookingStatus;
import com.example.TraficIntelligence.model.Bookings;
import java.util.List;
import java.util.Optional;


public interface BookingRepository extends JpaRepository<Bookings, Long>{
    List<Bookings> findByCustomerId(Long customerId);
    List<Bookings> findByStatus(BookingStatus pending);
    List<Bookings> findByDriverId(Long driverId);
    long countByDriverId(Long driverId);
    long countByDriverIdAndStatus(Long driverId, BookingStatus status);
    Optional<Bookings> findByDriverIdAndStatusIn(
        Long driverId,
        List<BookingStatus> statuses
    );

}
