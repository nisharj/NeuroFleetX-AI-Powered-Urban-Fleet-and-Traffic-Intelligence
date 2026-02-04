package com.neurofleetx.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.neurofleetx.dto.BookingDTO;
import com.neurofleetx.dto.CreateBookingRequest;
import com.neurofleetx.dto.VehicleDTO;
import com.neurofleetx.model.Booking;
import com.neurofleetx.model.User;
import com.neurofleetx.model.Vehicle;
import com.neurofleetx.repository.BookingRepository;
import com.neurofleetx.repository.CityRepository;
import com.neurofleetx.repository.UserRepository;
import com.neurofleetx.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class BookingService {

    private static final Logger logger = LoggerFactory.getLogger(BookingService.class);

    private final BookingRepository bookingRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final CityRepository cityRepository;
    private final RouteService routeService;
    private final ObjectMapper objectMapper;
    private final SimpMessagingTemplate messagingTemplate;

    
    /**
     * ✅ Create booking
     * - Rental: CONFIRMED + vehicle locked
     * - Ride-hailing: BROADCASTED (drivers can accept)
     */
    @Transactional
    public BookingDTO createBooking(CreateBookingRequest request, String userEmail) {

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Booking booking = new Booking();
        Vehicle vehicle = null;
        BigDecimal hourlyRate = BigDecimal.ZERO;

        // ✅ Distance calculation
        BigDecimal distanceKm = BigDecimal.ZERO;

        // 1) Dijkstra if city IDs exist
        if (request.getPickupCityId() != null && request.getReturnCityId() != null) {
            try {
                BigDecimal routeDist = routeService.getShortestDistance(
                        request.getPickupCityId(),
                        request.getReturnCityId());
                if (routeDist != null)
                    distanceKm = routeDist;
            } catch (Exception ignored) {
            }
        }

        // 2) fallback coordinates
        if (distanceKm.compareTo(BigDecimal.ZERO) == 0) {
            double distKmVal;
            if (request.getPickupLatitude() != null && request.getPickupLongitude() != null &&
                    request.getReturnLatitude() != null && request.getReturnLongitude() != null) {
                try {
                    distKmVal = calculateDistance(
                            request.getPickupLatitude(),
                            request.getPickupLongitude(),
                            request.getReturnLatitude(),
                            request.getReturnLongitude());
                } catch (Exception e) {
                    logger.error("Error calculating distance: {}", e.getMessage(), e);
                    distKmVal = 10.0;
                }
            } else {
                distKmVal = 10.0;
            }
            distanceKm = BigDecimal.valueOf(distKmVal).setScale(2, RoundingMode.HALF_UP);
        }

        // ✅ Calculate returnTime (if not given)
        LocalDateTime returnTime = request.getReturnTime();
        if (returnTime == null) {
            double avgSpeedKmH = 30.0;
            double hoursNeeded = distanceKm.doubleValue() / avgSpeedKmH;
            long minutes = (long) (hoursNeeded * 60);
            if (minutes < 15)
                minutes = 15;
            returnTime = request.getPickupTime().plusMinutes(minutes);
        }

        Duration duration = Duration.between(request.getPickupTime(), returnTime);
        BigDecimal hours = BigDecimal.valueOf(duration.toMinutes())
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);

        // ======================
        // ✅ RENTAL FLOW
        // ======================
        if (request.getVehicleId() != null) {

            vehicle = vehicleRepository.findById(request.getVehicleId())
                    .orElseThrow(() -> new RuntimeException("Vehicle not found"));

            List<Booking> conflicts = bookingRepository.findConflictingBookings(
                    vehicle.getId(),
                    request.getPickupTime(),
                    returnTime);

            if (!conflicts.isEmpty()) {
                throw new RuntimeException("Vehicle is not available for the selected time period");
            }

            booking.setVehicle(vehicle);
            booking.setStatus(Booking.BookingStatus.CONFIRMED); 
            hourlyRate = vehicle.getPricePerHour();

            // ✅ lock vehicle immediately
            vehicle.setStatus(Vehicle.VehicleStatus.BOOKED);
            vehicleRepository.save(vehicle);
        }

        // ======================
        // ✅ RIDE HAILING FLOW
        // ======================
        else {
            if (request.getVehicleType() == null || request.getVehicleType().isBlank()) {
                throw new RuntimeException("Vehicle Type is required for ride booking");
            }

            booking.setRequestedVehicleType(request.getVehicleType());
            booking.setStatus(Booking.BookingStatus.BROADCASTED);
            booking.setBroadcastedAt(LocalDateTime.now());

            // estimated rate
            hourlyRate = "EV".equalsIgnoreCase(request.getVehicleType())
                    ? new BigDecimal("20.00")
                    : new BigDecimal("15.00");
        }

        // ✅ Fare calculation
        BigDecimal baseFare = new BigDecimal("50.00");
        BigDecimal ratePerKm = new BigDecimal("10.00");

        if (vehicle != null
                && (vehicle.getType() == Vehicle.VehicleType.ELECTRICAL_VEHICLE || vehicle.getType() == Vehicle.VehicleType.BIKE)) {
            ratePerKm = new BigDecimal("5.00");
        }

        BigDecimal distanceCost = distanceKm.multiply(ratePerKm);
        BigDecimal estimatedCost = baseFare.add(distanceCost);

        BigDecimal taxAmount = estimatedCost.multiply(BigDecimal.valueOf(0.1));
        BigDecimal totalCost = estimatedCost.add(taxAmount);

        // ✅ Set booking fields
        booking.setBookingCode(generateBookingCode());
        booking.setUser(user);
        booking.setPickupTime(request.getPickupTime());
        booking.setReturnTime(returnTime);
        booking.setHourlyRate(hourlyRate);
        booking.setEstimatedHours(hours);

        booking.setBaseFare(baseFare);
        booking.setDistanceKm(distanceKm);
        booking.setRatePerKm(ratePerKm);

        booking.setEstimatedCost(estimatedCost);
        booking.setTaxAmount(taxAmount);
        booking.setTotalCost(totalCost);

        // Coordinates
        if (request.getPickupLatitude() != null)
            booking.setPickupLatitude(BigDecimal.valueOf(request.getPickupLatitude()));
        if (request.getPickupLongitude() != null)
            booking.setPickupLongitude(BigDecimal.valueOf(request.getPickupLongitude()));
        if (request.getReturnLatitude() != null)
            booking.setReturnLatitude(BigDecimal.valueOf(request.getReturnLatitude()));
        if (request.getReturnLongitude() != null)
            booking.setReturnLongitude(BigDecimal.valueOf(request.getReturnLongitude()));

        // details
        booking.setPickupAddress(request.getPickupAddress());
        booking.setDropAddress(request.getDropAddress());
        booking.setPassengerCount(request.getPassengerCount());
        booking.setContactNumber(request.getContactNumber());
        booking.setBookingType(request.getBookingType());

        booking.setPaymentStatus(Booking.PaymentStatus.PENDING);

        if (request.getPickupCityId() != null) {
            cityRepository.findById(request.getPickupCityId()).ifPresent(booking::setPickupCity);
        }

        if (request.getReturnCityId() != null) {
            cityRepository.findById(request.getReturnCityId()).ifPresent(booking::setReturnCity);
        }

        // ✅ Save booking
        try {
            booking = bookingRepository.save(booking);
        } catch (DataAccessException dae) {
            String root = dae.getRootCause() != null ? dae.getRootCause().getMessage() : dae.getMessage();
            logger.error("Failed to persist booking: {}", root, dae);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Database error while saving booking: " + (root != null ? root : "unknown"));
        }

        // ✅ Notify drivers only for ride-hailing bookings
        if (booking.getVehicle() == null) {
            try {
                BookingDTO dto = convertToDTO(booking);

                if (booking.getRequestedVehicleType() != null) {
                    messagingTemplate.convertAndSend("/topic/driver/" + booking.getRequestedVehicleType(), dto);
                }

                messagingTemplate.convertAndSend("/topic/ride-requests", dto);
                messagingTemplate.convertAndSendToUser(user.getEmail(), "/queue/bookings", dto);
            } catch (Exception e) {
                logger.warn("Failed to send booking notification: {}", e.getMessage());
            }
        }

        return convertToDTO(booking);
    }

    /**
     * ✅ Driver accepts ride-hailing booking (only 1 driver can succeed)
     */
    @Transactional
    public BookingDTO driverAcceptBooking(Long bookingId, String driverEmail, LocalDateTime clientAcceptedAt) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

        if (booking.getVehicle() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Booking already has a vehicle assigned");
        }

        if (booking.getStatus() != Booking.BookingStatus.BROADCASTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Booking not available for accept");
        }

        User driver = userRepository.findByEmail(driverEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));

        if (driver.getRole() != User.Role.DRIVER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User is not a driver");
        }

        if (!driver.getDetailsSubmitted() || driver.getApprovalStatus() != User.ApprovalStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Driver not eligible");
        }

        if (driver.getVehicle() == null || driver.getVehicle().getStatus() != Vehicle.VehicleStatus.AVAILABLE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Driver vehicle not available");
        }

        // ensure driver has no active rides
        List<Booking.BookingStatus> activeStatuses = List.of(
                Booking.BookingStatus.ACCEPTED,
                Booking.BookingStatus.ARRIVED,
                Booking.BookingStatus.STARTED);

        List<Booking> active = bookingRepository.findByDriverIdAndStatusIn(driver.getId(), activeStatuses);
        if (!active.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Driver already in active ride");
        }

        // lock
        LocalDateTime acceptedAt = clientAcceptedAt != null ? clientAcceptedAt : LocalDateTime.now();
        booking.setDriver(driver);
        booking.setAcceptedAt(acceptedAt);
        booking.setStatus(Booking.BookingStatus.ACCEPTED);

        // mark vehicle booked
        driver.getVehicle().setStatus(Vehicle.VehicleStatus.BOOKED);
        vehicleRepository.save(driver.getVehicle());

        booking = bookingRepository.save(booking);

        BookingDTO dto = convertToDTO(booking);

        messagingTemplate.convertAndSend("/topic/customer/" + booking.getUser().getId(), dto);
        messagingTemplate.convertAndSendToUser(driver.getEmail(), "/queue/bookings", dto);
        messagingTemplate.convertAndSend("/topic/bookings", dto);

        return dto;
    }

    @Transactional
    public BookingDTO markArrived(Long bookingId, String driverEmail) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // ✅ Security: only assigned driver
        if (booking.getDriver() == null || !booking.getDriver().getEmail().equals(driverEmail)) {
            throw new RuntimeException("Unauthorized driver");
        }

        if (booking.getStatus() != Booking.BookingStatus.ACCEPTED) {
            throw new RuntimeException("Booking not in ACCEPTED state");
        }

        booking.setArrivedAt(LocalDateTime.now());
        booking.setStatus(Booking.BookingStatus.ARRIVED);

        booking = bookingRepository.save(booking);
        BookingDTO dto = convertToDTO(booking);

        messagingTemplate.convertAndSend("/topic/customer/" + booking.getUser().getId(), dto);
        messagingTemplate.convertAndSendToUser(driverEmail, "/queue/bookings", dto);

        return dto;
    }

    @Transactional
    public BookingDTO markStarted(Long bookingId, String driverEmail) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // ✅ Security: only assigned driver
        if (booking.getDriver() == null || !booking.getDriver().getEmail().equals(driverEmail)) {
            throw new RuntimeException("Unauthorized driver");
        }

        if (booking.getStatus() != Booking.BookingStatus.ARRIVED) {
            throw new RuntimeException("Booking not in ARRIVED state");
        }

        booking.setStartedAt(LocalDateTime.now());
        booking.setStatus(Booking.BookingStatus.STARTED);

        // ✅ vehicle in use
        if (booking.getDriver() != null && booking.getDriver().getVehicle() != null) {
            Vehicle v = booking.getDriver().getVehicle();
            v.setStatus(Vehicle.VehicleStatus.IN_USE);
            vehicleRepository.save(v);
        }

        booking = bookingRepository.save(booking);
        BookingDTO dto = convertToDTO(booking);

        messagingTemplate.convertAndSend("/topic/customer/" + booking.getUser().getId(), dto);
        messagingTemplate.convertAndSendToUser(driverEmail, "/queue/bookings", dto);

        return dto;
    }

    @Transactional
    public BookingDTO markCompleted(Long bookingId, String driverEmail) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // ✅ Security: only assigned driver
        if (booking.getDriver() == null || !booking.getDriver().getEmail().equals(driverEmail)) {
            throw new RuntimeException("Unauthorized driver");
        }

        if (booking.getStatus() != Booking.BookingStatus.STARTED) {
            throw new RuntimeException("Booking not in STARTED state");
        }

        booking.setCompletedAt(LocalDateTime.now());
        booking.setStatus(Booking.BookingStatus.COMPLETED);

        // ✅ free vehicle
        if (booking.getDriver() != null && booking.getDriver().getVehicle() != null) {
            Vehicle v = booking.getDriver().getVehicle();
            v.setStatus(Vehicle.VehicleStatus.AVAILABLE);
            vehicleRepository.save(v);
        }

        booking = bookingRepository.save(booking);
        BookingDTO dto = convertToDTO(booking);

        messagingTemplate.convertAndSend("/topic/customer/" + booking.getUser().getId(), dto);
        messagingTemplate.convertAndSendToUser(driverEmail, "/queue/bookings", dto);
        messagingTemplate.convertAndSend("/topic/bookings", dto);

        return dto;
    }

    @Transactional
    public BookingDTO cancelBooking(Long bookingId, String cancelledByRole, String reason) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() == Booking.BookingStatus.COMPLETED ||
                booking.getStatus() == Booking.BookingStatus.EXPIRED) {
            throw new RuntimeException("Cannot cancel completed or expired booking");
        }

        booking.setCancelledAt(LocalDateTime.now());
        booking.setCancellationReason(reason);
        booking.setCancelledBy(cancelledByRole);

        if ("CUSTOMER".equalsIgnoreCase(cancelledByRole)) {
            booking.setStatus(Booking.BookingStatus.CANCELLED_BY_CUSTOMER);
        } else if ("DRIVER".equalsIgnoreCase(cancelledByRole)) {
            booking.setStatus(Booking.BookingStatus.CANCELLED_BY_DRIVER);
        } else {
            booking.setStatus(Booking.BookingStatus.CANCELLED_BY_ADMIN);
        }

        // ✅ free vehicle
        if (booking.getDriver() != null && booking.getDriver().getVehicle() != null) {
            Vehicle v = booking.getDriver().getVehicle();
            v.setStatus(Vehicle.VehicleStatus.AVAILABLE);
            vehicleRepository.save(v);
        }

        booking = bookingRepository.save(booking);
        BookingDTO dto = convertToDTO(booking);

        messagingTemplate.convertAndSend("/topic/customer/" + booking.getUser().getId(), dto);

        if (booking.getDriver() != null) {
            messagingTemplate.convertAndSendToUser(booking.getDriver().getEmail(), "/queue/bookings", dto);
        }

        messagingTemplate.convertAndSend("/topic/bookings", dto);

        return dto;
    }

    // =========================
    // ✅ READ APIs
    // =========================

    public List<BookingDTO> getUserBookings(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Booking> bookings = bookingRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        return bookings.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public List<VehicleDTO> getAvailableVehicles(LocalDateTime startTime, LocalDateTime endTime) {
        List<Vehicle> vehicles = vehicleRepository.findAvailableVehicles(startTime, endTime);
        return vehicles.stream().map(this::convertVehicleToDTO).collect(Collectors.toList());
    }

    public List<BookingDTO> getAllBookings() {
        return bookingRepository.findAll()
                .stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    /**
     * ✅ Pending ride-hailing bookings
     * (Use repository query, not findAll)
     */
    public List<BookingDTO> getPendingRideHailingBookings() {
        return bookingRepository.findPendingRideRequests()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<BookingDTO> getPendingRideHailingBookingsForType(String vehicleType) {
        if (vehicleType == null || vehicleType.isBlank())
            return getPendingRideHailingBookings();

        return bookingRepository.findByStatusAndRequestedVehicleType(
                Booking.BookingStatus.BROADCASTED,
                vehicleType).stream()
                .filter(b -> b.getVehicle() == null)
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // =========================
    // ✅ DTO Converters
    // =========================

    private BookingDTO convertToDTO(Booking booking) {
        return new BookingDTO(
                booking.getId(),
                booking.getBookingCode(),
                booking.getUser().getId(),
                booking.getVehicle() != null ? booking.getVehicle().getId() : null,
                booking.getVehicle() != null ? booking.getVehicle().getName() : null,
                booking.getPickupTime(),
                booking.getReturnTime(),
                booking.getHourlyRate(),
                booking.getEstimatedHours(),
                booking.getTotalCost(),
                booking.getBaseFare(),
                booking.getDistanceKm(),
                booking.getRatePerKm(),
                booking.getStatus().name(),
                booking.getPaymentStatus().name(),
                booking.getRequestedVehicleType(),
                booking.getPickupAddress(),
                booking.getDropAddress(),
                booking.getCreatedAt(),

                booking.getDriver() != null ? booking.getDriver().getId() : null,
                booking.getDriver() != null ? booking.getDriver().getName() : null,

                booking.getBroadcastedAt(),
                booking.getAcceptedAt(),
                booking.getArrivedAt(),
                booking.getStartedAt(),
                booking.getCompletedAt(),
                booking.getCancelledAt(),
                booking.getCancelledBy(),
                booking.getCancellationReason(),

                (booking.getBroadcastedAt() != null && booking.getAcceptedAt() != null)
                        ? Duration.between(booking.getBroadcastedAt(), booking.getAcceptedAt()).toMillis()
                        : null);
    }

    private VehicleDTO convertVehicleToDTO(Vehicle vehicle) {
        List<String> features = null;
        try {
            if (vehicle.getFeatures() != null) {
                features = objectMapper.readValue(vehicle.getFeatures(), new TypeReference<List<String>>() {
                });
            }
        } catch (Exception ignored) {
        }

        return new VehicleDTO(
                vehicle.getId(),
                vehicle.getVehicleCode(),
                vehicle.getName(),
                vehicle.getType().name(),
                vehicle.getModel(),
                vehicle.getSeats(),
                vehicle.getFuelType().name(),
                vehicle.getCurrentCity() != null ? vehicle.getCurrentCity().getName() : null,
                vehicle.getCurrentCity() != null ? vehicle.getCurrentCity().getId() : null,
                vehicle.getPricePerHour(),
                vehicle.getRating(),
                vehicle.getBatteryLevel(),
                features,
                vehicle.getAiScore().compareTo(BigDecimal.valueOf(0.85)) > 0,
                vehicle.getStatus().name());
    }

    // =========================
    // ✅ Rating
    // =========================

    @Transactional
    public BookingDTO rateRide(Long bookingId, Integer rating, String feedback) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setCustomerRating(rating);
        booking.setCustomerFeedback(feedback);

        if (booking.getVehicle() != null) {
            Vehicle vehicle = booking.getVehicle();
            Integer total = vehicle.getTotalRatings() != null ? vehicle.getTotalRatings() : 0;
            BigDecimal currentRate = vehicle.getRating() != null ? vehicle.getRating() : BigDecimal.ZERO;

            BigDecimal newRating = (currentRate.multiply(BigDecimal.valueOf(total))
                    .add(BigDecimal.valueOf(rating)))
                    .divide(BigDecimal.valueOf(total + 1), 2, RoundingMode.HALF_UP);

            vehicle.setTotalRatings(total + 1);
            vehicle.setRating(newRating);
            vehicleRepository.save(vehicle);
        }

        return convertToDTO(bookingRepository.save(booking));
    }

    // =========================
    // ✅ Helpers
    // =========================

    private String generateBookingCode() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = bookingRepository.count() + 1;
        return "BK-%s-%04d".formatted(date, count);
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                        * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    @Transactional
    @Scheduled(fixedRate = 60000) // every 1 minute
    public void autoExpireBookings() {

        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);

        List<Booking> expiredList = bookingRepository.findBookingsToExpire(cutoff);

        for (Booking booking : expiredList) {

            // ignore already cancelled/completed just in case
            if (booking.getStatus() == Booking.BookingStatus.COMPLETED ||
                booking.getStatus().name().startsWith("CANCELLED")) {
                continue;
            }

            booking.setStatus(Booking.BookingStatus.EXPIRED);
            booking.setCancelledAt(LocalDateTime.now());
            booking.setCancelledBy("SYSTEM");
            booking.setCancellationReason("Expired (not started within 24h)");

            // ✅ free vehicle if assigned
            if (booking.getDriver() != null && booking.getDriver().getVehicle() != null) {
                Vehicle v = booking.getDriver().getVehicle();
                v.setStatus(Vehicle.VehicleStatus.AVAILABLE);
                vehicleRepository.save(v);
            }

            bookingRepository.save(booking);

            // optional websocket notify
            try {
                BookingDTO dto = convertToDTO(booking);
                messagingTemplate.convertAndSend("/topic/customer/" + booking.getUser().getId(), dto);
            } catch (Exception ignored) {}
        }

        if (!expiredList.isEmpty()) {
            logger.info("Auto-expired {} bookings", expiredList.size());
        }
    }
}
