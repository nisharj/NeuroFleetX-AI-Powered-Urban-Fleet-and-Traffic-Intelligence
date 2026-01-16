package com.example.TraficIntelligence.controller;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.TraficIntelligence.config.UserPrincipal;
import com.example.TraficIntelligence.model.Bookings;
import com.example.TraficIntelligence.service.BookingService;


@RestController
@RequestMapping("/api/customer/bookings")
public class CustomerBookingController {

    private final BookingService bookingService;

    public CustomerBookingController(BookingService bookingService){
        this.bookingService = bookingService;
    }

    @PostMapping
    public Bookings bookRide(
            @RequestBody Bookings booking,
            @AuthenticationPrincipal UserPrincipal user
    ) {
        return bookingService.createBooking(booking, user.getId());
    }


    @GetMapping
    public List<Bookings> getMyBookings(
        @AuthenticationPrincipal UserPrincipal user
    ) {
        return bookingService.getCustomerBookings(user.getId());
    }
}
