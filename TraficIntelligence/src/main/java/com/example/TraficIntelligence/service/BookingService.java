package com.example.TraficIntelligence.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.TraficIntelligence.model.BookingStatus;
import com.example.TraficIntelligence.model.Bookings;
import com.example.TraficIntelligence.repository.BookingRepository;
import com.example.TraficIntelligence.util.GeoUtil;

@Service
public class BookingService {

    private final BookingRepository bookingRepo;

    public BookingService(BookingRepository bookingRepo) {
        this.bookingRepo = bookingRepo;
    }

    public Bookings createBooking(Bookings booking, Long customerId) {
        // 1. Validate coordinates
        if (
            booking.getPickupLat() == null ||
            booking.getPickupLng() == null ||
            booking.getDropLat() == null ||
            booking.getDropLng() == null
        ) {
            throw new RuntimeException("Pickup and Drop locations are required");
        }

        // 2. Calculate distance
        double distance = GeoUtil.calculateDistance(
            booking.getPickupLat(),
            booking.getPickupLng(),
            booking.getDropLat(),
            booking.getDropLng()
        );

        // 3. Calculate fare (basic rule)
        double fare = 50 + (distance * 12);

        // 4. Populate system-controlled fields
        booking.setCustomerId(customerId);
        booking.setDistanceKm(distance);
        booking.setFare((double) Math.round(fare));
        booking.setStatus(BookingStatus.PENDING);

        // 5. Save
        return bookingRepo.save(booking);
    }


    public List<Bookings> getCustomerBookings(Long customerId) {
        return bookingRepo.findByCustomerId(customerId);
    }

    public List<Bookings> getPendingBookings() {
        return bookingRepo.findByStatus(BookingStatus.PENDING);
    }

    public Bookings acceptBooking(Long bookingId, Long driverId) {
        Bookings booking = bookingRepo.findById(bookingId).orElseThrow();

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new RuntimeException("Booking already taken");
        }

        booking.setDriverId(driverId);
        booking.setStatus(BookingStatus.ACCEPTED);
        return bookingRepo.save(booking);
    }

    public void rejectBooking(Long id) {
        bookingRepo.deleteById(id);
    }

    public Bookings getActiveRide(Long driverId) {
        return bookingRepo.findByDriverIdAndStatusIn(
            driverId,
            List.of(BookingStatus.ACCEPTED, BookingStatus.IN_PROGRESS)
        ).orElse(null);
    }

    public Bookings completeBooking(Long bookingId) {
        Bookings booking = bookingRepo.findById(bookingId).orElseThrow();
        booking.setStatus(BookingStatus.COMPLETED);
        return bookingRepo.save(booking);
    }

    public Bookings startRide(Long bookingId) {
        Bookings booking = bookingRepo.findById(bookingId).orElseThrow();
        booking.setStatus(BookingStatus.IN_PROGRESS);
        return bookingRepo.save(booking);
    }

}
