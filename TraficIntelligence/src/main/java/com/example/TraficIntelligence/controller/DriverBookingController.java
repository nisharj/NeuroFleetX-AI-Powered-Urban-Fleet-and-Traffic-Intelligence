package com.example.TraficIntelligence.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.TraficIntelligence.config.UserPrincipal;
import com.example.TraficIntelligence.model.Bookings;
import com.example.TraficIntelligence.service.BookingService;

@RestController
@RequestMapping("/api/driver/bookings")
public class DriverBookingController {

    @Autowired
    private final BookingService bookingService;

    public DriverBookingController(BookingService bookingService){
        this.bookingService = bookingService;
    }

    @GetMapping("/pending")
    public List<Bookings> viewAvailableBookings() {
        return bookingService.getPendingBookings();
    }

    @PostMapping("/{id}/accept")
    public Bookings acceptBooking(
        @PathVariable Long id,
        @AuthenticationPrincipal UserPrincipal driver
    ) {
        return bookingService.acceptBooking(id, driver.getId());
    }

    @GetMapping("/active")
    public Bookings activeRide(
        @AuthenticationPrincipal UserPrincipal driver
    ) {
        return bookingService.getActiveRide(driver.getId());
    }

    @PostMapping("/{id}/complete")
    public Bookings complete(@PathVariable Long id) {
        return bookingService.completeBooking(id);
    }

    @PostMapping("/{id}/start")
    public Bookings startRide(@PathVariable Long id) {
        return bookingService.startRide(id);
    }


    @PostMapping("/{id}/reject")
    public void reject(@PathVariable Long id) {
        bookingService.rejectBooking(id);
    }

}
