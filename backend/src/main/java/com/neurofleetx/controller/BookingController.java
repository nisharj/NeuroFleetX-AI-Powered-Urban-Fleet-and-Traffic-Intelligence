package com.neurofleetx.controller;

import com.neurofleetx.dto.BookingDTO;
import com.neurofleetx.dto.CreateBookingRequest;
import com.neurofleetx.dto.RateRideRequest;
import com.neurofleetx.dto.VehicleDTO;
import com.neurofleetx.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BookingController {

    private static final Logger logger = LoggerFactory.getLogger(BookingController.class);

    private final BookingService bookingService;

    /**
     * ✅ Customer creates a booking (Rental or Ride-Hailing)
     */
    @PostMapping("/bookings")
    public ResponseEntity<?> createBooking(
            @RequestBody @Valid CreateBookingRequest request,
            Authentication authentication) {

        try {
            if (authentication == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Unauthorized"));
            }

            String userEmail = authentication.getName();
            logger.info("Create booking request by user={}", userEmail);

            BookingDTO booking = bookingService.createBooking(request, userEmail);

            logger.info("Booking created successfully: {}", booking.getBookingCode());
            return ResponseEntity.status(HttpStatus.CREATED).body(booking);

        } catch (Exception e) {
            logger.error("Error creating booking: {}", e.getMessage(), e);

            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getClass().getSimpleName());
            errorResponse.put("message", e.getMessage() != null ? e.getMessage() : "Unknown error occurred");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * ✅ Customer booking history (only their bookings)
     */
    @GetMapping("/bookings/user")
    public ResponseEntity<?> getUserBookings(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Unauthorized"));
        }

        String userEmail = authentication.getName();
        List<BookingDTO> bookings = bookingService.getUserBookings(userEmail);
        return ResponseEntity.ok(bookings);
    }

    /**
     * ✅ Rental availability check
     */
    @GetMapping("/vehicles/available")
    public ResponseEntity<List<VehicleDTO>> getAvailableVehicles(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {

        List<VehicleDTO> vehicles = bookingService.getAvailableVehicles(startTime, endTime);
        return ResponseEntity.ok(vehicles);
    }

    /**
     * ✅ Rate ride (after completion)
     */
    @PostMapping("/bookings/{id}/rate")
    public ResponseEntity<BookingDTO> rateRide(
            @PathVariable Long id,
            @RequestBody RateRideRequest request) {

        BookingDTO booking = bookingService.rateRide(id, request.getRating(), request.getFeedback());
        return ResponseEntity.ok(booking);
    }

    /**
     * ✅ Admin: get all bookings
     */
    @GetMapping("/bookings/all")
    public ResponseEntity<List<BookingDTO>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    /**
     * ✅ Driver: Get pending ride-hailing requests (BROADCASTED bookings)
     */
    @GetMapping("/bookings/pending")
    public ResponseEntity<List<BookingDTO>> getPendingBookings(@RequestParam(required = false) String vehicleType) {

        List<BookingDTO> pendingBookings = (vehicleType != null && !vehicleType.isBlank())
                ? bookingService.getPendingRideHailingBookingsForType(vehicleType)
                : bookingService.getPendingRideHailingBookings();

        return ResponseEntity.ok(pendingBookings);
    }

    /**
     * ✅ Driver accepts booking
     */
    @PostMapping("/bookings/{bookingId}/accept")
    public ResponseEntity<?> acceptBooking(
            @PathVariable Long bookingId,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {

        try {
            String driverEmail = authentication != null ? authentication.getName() : null;

            // fallback: allow post body (not recommended in prod)
            if (body != null && body.get("driverEmail") != null) {
                driverEmail = body.get("driverEmail");
            }

            if (driverEmail == null || driverEmail.isBlank()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Unauthorized driver"));
            }

            LocalDateTime clientAcceptedAt = null;
            if (body != null && body.get("acceptedAt") != null) {
                try {
                    clientAcceptedAt = java.time.OffsetDateTime.parse(body.get("acceptedAt")).toLocalDateTime();
                } catch (Exception ex) {
                    clientAcceptedAt = LocalDateTime.parse(body.get("acceptedAt"));
                }
            }

            logger.info("Driver {} attempting to accept booking {}", driverEmail, bookingId);

            BookingDTO booking = bookingService.driverAcceptBooking(bookingId, driverEmail, clientAcceptedAt);
            return ResponseEntity.ok(booking);

        } catch (org.springframework.web.server.ResponseStatusException e) {
            logger.warn("Error accepting booking: {}", e.getReason());
            return ResponseEntity.status(e.getStatusCode()).body(Map.of(
                    "error", e.getStatusCode().toString(),
                    "message", e.getReason() != null ? e.getReason() : "Failed to accept"
            ));
        } catch (Exception e) {
            logger.error("Error accepting booking: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "error", e.getClass().getSimpleName(),
                    "message", e.getMessage() != null ? e.getMessage() : "Failed to accept"
            ));
        }
    }

    /**
     * ✅ Driver marks arrived
     */
    @PostMapping("/bookings/{bookingId}/arrived")
    public ResponseEntity<?> arrived(@PathVariable Long bookingId, Authentication authentication) {
        try {
            if (authentication == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Unauthorized"));
            }

            String driverEmail = authentication.getName();
            BookingDTO booking = bookingService.markArrived(bookingId, driverEmail);

            return ResponseEntity.ok(booking);

        } catch (Exception e) {
            logger.error("Error marking arrived: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * ✅ Driver starts ride
     */
    @PostMapping("/bookings/{bookingId}/start")
    public ResponseEntity<?> start(@PathVariable Long bookingId, Authentication authentication) {
        try {
            if (authentication == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Unauthorized"));
            }

            String driverEmail = authentication.getName();
            BookingDTO booking = bookingService.markStarted(bookingId, driverEmail);

            return ResponseEntity.ok(booking);

        } catch (Exception e) {
            logger.error("Error marking started: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * ✅ Driver completes ride
     */
    @PostMapping("/bookings/{bookingId}/complete")
    public ResponseEntity<?> complete(@PathVariable Long bookingId, Authentication authentication) {
        try {
            if (authentication == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Unauthorized"));
            }

            String driverEmail = authentication.getName();
            BookingDTO booking = bookingService.markCompleted(bookingId, driverEmail);

            return ResponseEntity.ok(booking);

        } catch (Exception e) {
            logger.error("Error marking completed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * ✅ Cancel booking (customer/driver/admin)
     */
    @PostMapping("/bookings/{bookingId}/cancel")
    public ResponseEntity<?> cancel(
            @PathVariable Long bookingId,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication) {

        try {
            String cancelledByRole = "ADMIN";

            if (authentication != null &&
                    authentication.getAuthorities() != null &&
                    !authentication.getAuthorities().isEmpty()) {

                String authority = authentication.getAuthorities().iterator().next().getAuthority(); // eg ROLE_DRIVER
                cancelledByRole = authority.replace("ROLE_", "");
            }

            String reason = body != null ? body.getOrDefault("reason", "") : "";

            BookingDTO booking = bookingService.cancelBooking(bookingId, cancelledByRole, reason);
            return ResponseEntity.ok(booking);

        } catch (Exception e) {
            logger.error("Error cancelling booking: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * ✅ Driver current/active trip
     * returns booking if driver has ACCEPTED/ARRIVED/STARTED ride
     */
    @GetMapping("/bookings/driver/active")
    public ResponseEntity<?> getDriverActive(Authentication authentication) {
        try {
            if (authentication == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Unauthorized"));
            }

            String driverEmail = authentication.getName();
            BookingDTO booking = bookingService.getDriverActiveRide(driverEmail);

            // ✅ better response instead of NO_CONTENT
            if (booking == null) {
                return ResponseEntity.ok(null);
            }

            return ResponseEntity.ok(booking);

        } catch (Exception e) {
            logger.error("Error fetching driver active ride: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", e.getClass().getSimpleName(),
                            "message", e.getMessage() != null ? e.getMessage() : "Failed to fetch active ride"
                    ));
        }
    }
}
