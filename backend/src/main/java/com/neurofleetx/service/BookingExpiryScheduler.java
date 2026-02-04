package com.neurofleetx.service;

import com.neurofleetx.model.Booking;
import com.neurofleetx.repository.BookingRepository;
import com.neurofleetx.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class BookingExpiryScheduler {

    private static final Logger logger = LoggerFactory.getLogger(BookingExpiryScheduler.class);

    private final BookingRepository bookingRepository;
    private final VehicleRepository vehicleRepository;

    // ✅ Runs every 10 minutes
    @Scheduled(fixedRate = 10 * 60 * 1000)
    @Transactional
    public void autoCancelExpiredBookings() {

        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);

        List<Booking> expiredBookings = bookingRepository.findBookingsToExpire(cutoff);

        if (expiredBookings.isEmpty()) return;

        logger.info("Auto-expiring {} bookings older than 24 hours", expiredBookings.size());

        for (Booking b : expiredBookings) {
            // set EXPIRED
            b.setStatus(Booking.BookingStatus.EXPIRED);
            b.setCancelledAt(LocalDateTime.now());
            b.setCancelledBy("SYSTEM");
            b.setCancellationReason("Ride not started within 24 hours of pickup time");

            // ✅ if driver assigned -> free vehicle
            if (b.getDriver() != null && b.getDriver().getVehicle() != null) {
                var vehicle = b.getDriver().getVehicle();
                vehicle.setStatus(com.neurofleetx.model.Vehicle.VehicleStatus.AVAILABLE);
                vehicleRepository.save(vehicle);
            }

            bookingRepository.save(b);
        }
    }
}
