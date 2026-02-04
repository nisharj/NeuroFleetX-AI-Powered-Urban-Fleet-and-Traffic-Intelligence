package com.neurofleetx.service;

import com.neurofleetx.dto.RideLifecycleDTO;
import com.neurofleetx.model.Booking;
import com.neurofleetx.model.User;
import com.neurofleetx.repository.BookingRepository;
import com.neurofleetx.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Complete Ride Lifecycle Service
 * Manages all transitions: PENDING → ACCEPTED → ONGOING → COMPLETED/CANCELLED
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RideLifecycleService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // ===================== RIDE ACCEPTANCE FLOW =====================

    /**
     * Driver accepts a pending ride
     * Validates: status must be PENDING/BROADCASTED, no existing driver
     * Atomic operation to prevent race conditions
     */
    @Transactional
    public RideLifecycleDTO driverAcceptRide(Long bookingId, Long driverId) {
        log.info("Driver {} attempting to accept booking {}", driverId, bookingId);

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));

        // Validation: Check status
        if (booking.getStatus() != Booking.BookingStatus.PENDING &&
                booking.getStatus() != Booking.BookingStatus.BROADCASTED) {
            throw new RuntimeException("Booking not available for acceptance. Current status: " + booking.getStatus());
        }

        // Validation: Check if already has driver
        if (booking.getDriver() != null) {
            throw new RuntimeException("Booking already accepted by another driver");
        }

        // Fetch driver
        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found: " + driverId));

        if (!driver.getRole().equals("driver")) {
            throw new RuntimeException("User is not a driver");
        }

        // Update booking
        booking.setDriver(driver);
        booking.setStatus(Booking.BookingStatus.ACCEPTED);
        booking.setAcceptedAt(LocalDateTime.now());
        booking = bookingRepository.save(booking);

        log.info("Booking {} accepted by driver {}", bookingId, driverId);

        // Convert to DTO
        RideLifecycleDTO dto = convertToDTO(booking);

        // Emit real-time updates
        notifyCustomerRideAccepted(booking, dto);
        notifyDriverRideAccepted(booking, dto);

        return dto;
    }

    // ===================== RIDE STATUS UPDATES =====================

    /**
     * Driver arrived at pickup location
     */
    @Transactional
    public RideLifecycleDTO driverArrivedAtPickup(Long bookingId, Long driverId) {
        Booking booking = findAndValidateBooking(bookingId, driverId,
                Booking.BookingStatus.ACCEPTED, "Driver not yet accepted this ride");

        booking.setArrivedAt(LocalDateTime.now());
        booking.setStatus(Booking.BookingStatus.ARRIVED);
        booking = bookingRepository.save(booking);

        RideLifecycleDTO dto = convertToDTO(booking);
        notifyBothParties(booking, "Driver has arrived at pickup location", dto);

        return dto;
    }

    /**
     * Start the ride (after customer boards)
     */
    @Transactional
    public RideLifecycleDTO startRide(Long bookingId, Long driverId) {
        Booking booking = findAndValidateBooking(bookingId, driverId,
                Booking.BookingStatus.ARRIVED, "Ride can only start after driver arrival");

        booking.setStartedAt(LocalDateTime.now());
        booking.setStatus(Booking.BookingStatus.STARTED);
        booking = bookingRepository.save(booking);

        RideLifecycleDTO dto = convertToDTO(booking);
        notifyBothParties(booking, "Ride has started", dto);

        return dto;
    }

    /**
     * Complete the ride
     */
    @Transactional
    public RideLifecycleDTO completeRide(Long bookingId, Long driverId,
            Double finalLat, Double finalLng) {
        Booking booking = findAndValidateBooking(bookingId, driverId,
                Booking.BookingStatus.STARTED, "Ride can only be completed after starting");

        booking.setCompletedAt(LocalDateTime.now());
        booking.setStatus(Booking.BookingStatus.COMPLETED);
        booking.setPaymentStatus(Booking.PaymentStatus.PENDING); // Awaiting payment
        booking = bookingRepository.save(booking);

        RideLifecycleDTO dto = convertToDTO(booking);
        notifyBothParties(booking, "Ride completed successfully", dto);

        return dto;
    }

    // ===================== CANCELLATION FLOW =====================

    /**
     * Customer cancels ride
     * Can cancel at any stage except COMPLETED
     */
    @Transactional
    public RideLifecycleDTO customerCancelRide(Long bookingId, Long customerId,
            String reason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getUser().getId().equals(customerId)) {
            throw new RuntimeException("Customer can only cancel their own rides");
        }

        if (booking.getStatus() == Booking.BookingStatus.COMPLETED) {
            throw new RuntimeException("Cannot cancel a completed ride");
        }

        booking.setStatus(Booking.BookingStatus.CANCELLED_BY_CUSTOMER);
        booking.setCancelledAt(LocalDateTime.now());
        booking.setCancelledBy("CUSTOMER");
        booking.setCancellationReason(reason);

        // Refund logic (if payment was made)
        if (booking.getPaymentStatus() == Booking.PaymentStatus.PAID) {
            booking.setPaymentStatus(Booking.PaymentStatus.REFUNDED);
        }

        booking = bookingRepository.save(booking);

        RideLifecycleDTO dto = convertToDTO(booking);
        notifyBothParties(booking, "Ride cancelled by customer", dto);

        return dto;
    }

    /**
     * Driver cancels ride
     * Can cancel only before ride starts
     */
    @Transactional
    public RideLifecycleDTO driverCancelRide(Long bookingId, Long driverId,
            String reason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getDriver() == null || !booking.getDriver().getId().equals(driverId)) {
            throw new RuntimeException("Driver not assigned to this ride");
        }

        if (booking.getStatus() == Booking.BookingStatus.STARTED ||
                booking.getStatus() == Booking.BookingStatus.COMPLETED) {
            throw new RuntimeException("Driver cannot cancel ride after starting");
        }

        booking.setStatus(Booking.BookingStatus.CANCELLED_BY_DRIVER);
        booking.setCancelledAt(LocalDateTime.now());
        booking.setCancelledBy("DRIVER");
        booking.setCancellationReason(reason);
        booking.setDriver(null); // Unassign driver to allow reassignment

        booking = bookingRepository.save(booking);

        RideLifecycleDTO dto = convertToDTO(booking);
        notifyBothParties(booking, "Ride cancelled by driver", dto);

        return dto;
    }

    // ===================== RETRIEVAL & LISTING =====================

    /**
     * Get all pending rides for drivers (for accepting)
     */
    public List<RideLifecycleDTO> getPendingRides(String vehicleType) {
        List<Booking> bookings = bookingRepository.findByStatusAndRequestedVehicleType(
                Booking.BookingStatus.PENDING,
                vehicleType);
        return bookings.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get active ride for driver (currently accepted or ongoing)
     */
    public RideLifecycleDTO getActiveRideForDriver(Long driverId) {
        Booking booking = bookingRepository.findActiveRideForDriver(driverId)
                .orElseThrow(() -> new RuntimeException("No active ride for driver"));
        return convertToDTO(booking);
    }

    /**
     * Get active ride for customer
     */
    public RideLifecycleDTO getActiveRideForCustomer(Long customerId) {
        Booking booking = bookingRepository.findActiveRideForCustomer(customerId)
                .orElseThrow(() -> new RuntimeException("No active ride for customer"));
        return convertToDTO(booking);
    }

    /**
     * Get ride history for customer
     */
    public List<RideLifecycleDTO> getCustomerRideHistory(Long customerId) {
        List<Booking> bookings = bookingRepository.findCustomerCompletedRides(customerId);
        return bookings.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get ride history for driver
     */
    public List<RideLifecycleDTO> getDriverRideHistory(Long driverId) {
        List<Booking> bookings = bookingRepository.findDriverCompletedRides(driverId);
        return bookings.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ===================== HELPER METHODS =====================

    /**
     * Validate booking exists and belongs to the driver
     */
    private Booking findAndValidateBooking(Long bookingId, Long driverId,
            Booking.BookingStatus expectedStatus,
            String errorMsg) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getDriver() == null || !booking.getDriver().getId().equals(driverId)) {
            throw new RuntimeException("Unauthorized: Driver not assigned to this ride");
        }

        if (booking.getStatus() != expectedStatus) {
            throw new RuntimeException(errorMsg + ". Current status: " + booking.getStatus());
        }

        return booking;
    }

    /**
     * Convert Booking entity to RideLifecycleDTO
     */
    private RideLifecycleDTO convertToDTO(Booking booking) {
        return RideLifecycleDTO.builder()
                .bookingId(booking.getId())
                .bookingCode(booking.getBookingCode())
                .customerId(booking.getUser().getId())
                .customerName(booking.getUser().getName())
                .customerPhone(booking.getUser().getPhone())
                .driverId(booking.getDriver() != null ? booking.getDriver().getId() : null)
                .driverName(booking.getDriver() != null ? booking.getDriver().getName() : null)
                .driverPhone(booking.getDriver() != null ? booking.getDriver().getPhone() : null)
                .pickupAddress(booking.getPickupAddress())
                .pickupLat(booking.getPickupLatitude() != null ? booking.getPickupLatitude().doubleValue() : null)
                .pickupLng(booking.getPickupLongitude() != null ? booking.getPickupLongitude().doubleValue() : null)
                .dropAddress(booking.getDropAddress())
                .dropLat(booking.getReturnLatitude() != null ? booking.getReturnLatitude().doubleValue() : null)
                .dropLng(booking.getReturnLongitude() != null ? booking.getReturnLongitude().doubleValue() : null)
                .fare(booking.getTotalCost())
                .distance(booking.getDistanceKm())
                .passengerCount(booking.getPassengerCount())
                .contactNumber(booking.getContactNumber())
                .status(mapStatusToString(booking.getStatus()))
                .cancelledBy(booking.getCancelledBy())
                .cancellationReason(booking.getCancellationReason())
                .createdAt(booking.getCreatedAt())
                .acceptedAt(booking.getAcceptedAt())
                .startedAt(booking.getStartedAt())
                .completedAt(booking.getCompletedAt())
                .cancelledAt(booking.getCancelledAt())
                .customerRating(booking.getCustomerRating())
                .customerFeedback(booking.getCustomerFeedback())
                .build();
    }

    /**
     * Map internal enum to simple string status
     */
    private String mapStatusToString(Booking.BookingStatus status) {
        switch (status) {
            case PENDING:
            case BROADCASTED:
                return "PENDING";
            case ACCEPTED:
            case ARRIVED:
                return "ACCEPTED";
            case STARTED:
                return "ONGOING";
            case COMPLETED:
                return "COMPLETED";
            case CANCELLED_BY_CUSTOMER:
            case CANCELLED_BY_DRIVER:
            case CANCELLED_BY_ADMIN:
                return "CANCELLED";
            default:
                return "PENDING";
        }
    }

    // ===================== WEBSOCKET NOTIFICATIONS =====================

    private void notifyCustomerRideAccepted(Booking booking, RideLifecycleDTO dto) {
        String destination = "/topic/customer/" + booking.getUser().getId();
        messagingTemplate.convertAndSend(destination, dto);
        log.debug("Notified customer {} of ride acceptance", booking.getUser().getId());
    }

    private void notifyDriverRideAccepted(Booking booking, RideLifecycleDTO dto) {
        String destination = "/topic/driver/" + booking.getDriver().getId();
        messagingTemplate.convertAndSend(destination, dto);
        log.debug("Notified driver {} of ride acceptance", booking.getDriver().getId());
    }

    private void notifyBothParties(Booking booking, String message, RideLifecycleDTO dto) {
        if (booking.getUser() != null) {
            messagingTemplate.convertAndSend(
                    "/topic/customer/" + booking.getUser().getId(),
                    dto);
        }
        if (booking.getDriver() != null) {
            messagingTemplate.convertAndSend(
                    "/topic/driver/" + booking.getDriver().getId(),
                    dto);
        }
    }

    /**
     * Get user ID by email (for JWT extraction)
     */
    public Long getUserIdByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        return user.getId();
    }
}
