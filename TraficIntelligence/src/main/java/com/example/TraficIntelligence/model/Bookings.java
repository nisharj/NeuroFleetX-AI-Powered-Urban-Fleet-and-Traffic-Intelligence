package com.example.TraficIntelligence.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "bookings")
public class Bookings {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long customerId;
    private Long driverId;

    private String pickup;
    private Double pickupLat;
    private Double pickupLng;

    private String dropLocation;
    private Double dropLat;
    private Double dropLng;
    
    @Enumerated(EnumType.STRING)
    private RideType rideType;
    
    private LocalDate rideDate;
    private LocalTime rideTime;

    private String contactNumber;

    private Integer passengerCount;

    private Double distanceKm;
    private Double fare;

    @Enumerated(EnumType.STRING)
    private BookingStatus status;

    private String vehicleType;

    private Integer rating; 
    private String feedback;       

    private LocalDateTime acceptedAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    private LocalDateTime createdAt = LocalDateTime.now();

    public void setId(Long id){ this.id = id; }
    public Long getId(){ return id; }

    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public Long getCustomerId(){ return customerId; }

    public void setDriverId(Long driverId){this.driverId = driverId; }
    public Long getDriverId() { return driverId; }

    public void setPickup(String pickup) { this.pickup = pickup; }
    public String getPickup(){ return pickup; }
    
    public void setDropLocation(String dropLocation) { this.dropLocation = dropLocation; }
    public String getDropLocation(){ return dropLocation; }

    public void setRideDate(LocalDate rideDate) { this.rideDate = rideDate; }
    public LocalDate getRideDate(){ return rideDate; }
    
    public void setRideTime(LocalTime rideTime) { this.rideTime = rideTime; }
    public LocalTime getRideTime(){ return rideTime; }

    public BookingStatus getStatus() { return status; }
    public void setStatus(BookingStatus pending) { this.status = pending; }

    public void setPickupLat(Double pickupLat) { this.pickupLat = pickupLat; }
    public Double getPickupLat() { return pickupLat; }

    public void setPickupLng(Double pickupLng){ this.pickupLng = pickupLng; }
    public Double getPickupLng(){ return pickupLng; }
    
    public void setDropLat(Double dropLat) { this.dropLat = dropLat; }
    public Double getDropLat() { return dropLat; }

    public void setDropLng(Double dropLng){ this.dropLng = dropLng; }
    public Double getDropLng(){ return dropLng; }

    public void setRideType(RideType rideType) { this.rideType = rideType;}
    public RideType getRideType(){ return rideType; }

    public void setPassengerCount(Integer passengerCount) { this.passengerCount = passengerCount; }
    public Integer getPassengerCount() { return passengerCount; }

    public void setContactNumber(String contactNumber){ this.contactNumber = contactNumber; }
    public String getContactNumber(){ return contactNumber; }
    
    public void setDistanceKm(Double distanceKm){ this.distanceKm = distanceKm; }
    public Double getDistancceKm(){ return distanceKm; }

    public void setFare(Double fare){ this.fare = fare; }
    public Double getFare(){ return fare; }

    public void setVehicleType(String vehicleType){ this.vehicleType = vehicleType; }
    public String getVehicleType(){return vehicleType;}

    public void setRating(Integer rating){ this.rating = rating; }
    public Integer getRating() { return rating; }

    public void setFeedback(String feedback){ this.feedback = feedback; }
    public String getFeedback(){ return feedback; } 

    public void setAcceptedAt(LocalDateTime acceptedAt){ this.acceptedAt = acceptedAt; }
    public LocalDateTime getAcceptedAt(){ return acceptedAt; }

    public void setStartedAt(LocalDateTime startedAt){ this.startedAt = startedAt; }
    public LocalDateTime getStartedAt(){ return startedAt; }

    public void setCompletedAt(LocalDateTime completedAt){ this.completedAt = completedAt; }
    public LocalDateTime getCompletedAt(){ return completedAt; }

}
