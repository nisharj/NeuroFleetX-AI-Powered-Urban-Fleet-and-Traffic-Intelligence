package com.neurofleetx.service;

import com.neurofleetx.model.City;
import com.neurofleetx.model.Vehicle;
import com.neurofleetx.repository.CityRepository;
import com.neurofleetx.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final CityRepository cityRepository;

    public VehicleService(VehicleRepository vehicleRepository, CityRepository cityRepository) {
        this.vehicleRepository = vehicleRepository;
        this.cityRepository = cityRepository;
    }


    /**
     * Get all vehicles
     */
    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }

    /**
     * Get vehicle by ID
     */
    public Optional<Vehicle> getVehicleById(Long id) {
        return vehicleRepository.findById(id);
    }
    
    public Optional<Vehicle> getVehicleByCode(String code) {
        return vehicleRepository.findByVehicleCode(code);
    }

    /**
     * Create new vehicle
     */
    public Vehicle createVehicle(Vehicle vehicle) {
        // Ensure City is attached if provided as a transient object with name
        if (vehicle.getCurrentCity() != null && vehicle.getCurrentCity().getId() == null) {
            String cityName = vehicle.getCurrentCity().getName();
            City city = cityRepository.findByName(cityName).orElseThrow(() -> new RuntimeException("City not found: " + cityName));
            vehicle.setCurrentCity(city);
        }
        return vehicleRepository.save(vehicle);
    }

    /**
     * Update vehicle
     */
    public Vehicle updateVehicle(Long id, Vehicle vehicleDetails) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + id));

        // Update fields
        vehicle.setName(vehicleDetails.getName());
        vehicle.setType(vehicleDetails.getType());
        vehicle.setStatus(vehicleDetails.getStatus());
        vehicle.setBatteryLevel(vehicleDetails.getBatteryLevel());
        vehicle.setCurrentLatitude(vehicleDetails.getCurrentLatitude());
        vehicle.setCurrentLongitude(vehicleDetails.getCurrentLongitude());
        vehicle.setMileage(vehicleDetails.getMileage());
        vehicle.setLastMaintenanceDate(vehicleDetails.getLastMaintenanceDate());
        vehicle.setEngineHealth(vehicleDetails.getEngineHealth());
        vehicle.setTireHealth(vehicleDetails.getTireHealth());
        vehicle.setBrakeHealth(vehicleDetails.getBrakeHealth());
        vehicle.setSeats(vehicleDetails.getSeats());
        vehicle.setPricePerHour(vehicleDetails.getPricePerHour());
        vehicle.setRating(vehicleDetails.getRating());

        // Handle City Update
        if (vehicleDetails.getCurrentCity() != null) {
            City city;
            if (vehicleDetails.getCurrentCity().getId() != null) {
                city = cityRepository.findById(vehicleDetails.getCurrentCity().getId()).orElse(null);
            } else if (vehicleDetails.getCurrentCity().getName() != null) {
                 city = cityRepository.findByName(vehicleDetails.getCurrentCity().getName()).orElse(null);
            } else {
                city = null;
            }
            
            if (city != null) {
                vehicle.setCurrentCity(city);
            }
        }

        return vehicleRepository.save(vehicle);
    }

    /**
     * Delete vehicle
     */
    public void deleteVehicle(Long id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + id));
        vehicleRepository.delete(vehicle);
    }

    /**
     * Get vehicles by status
     */
    public List<Vehicle> getVehiclesByStatus(Vehicle.VehicleStatus status) {
        return vehicleRepository.findByStatus(status);
    }

    /**
     * Get available vehicles
     */
    public List<Vehicle> getAvailableVehicles() {
        return vehicleRepository.findByStatus(Vehicle.VehicleStatus.AVAILABLE);
    }

    /**
     * Get vehicles by type
     */
    public List<Vehicle> getVehiclesByType(Vehicle.VehicleType type) {
        return vehicleRepository.findByType(type);
    }

    /**
     * Get vehicles by city
     */
    public List<Vehicle> getVehiclesByCity(String cityName) {
        return vehicleRepository.findByCurrentCity_Name(cityName);
    }

    /**
     * Get vehicles needing maintenance
     */
    public List<Vehicle> getVehiclesNeedingMaintenance() {
        return vehicleRepository.findVehiclesNeedingMaintenance();
    }

    /**
     * Update vehicle status
     */
    public Vehicle updateVehicleStatus(Long id, Vehicle.VehicleStatus status) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + id));
        vehicle.setStatus(status);
        return vehicleRepository.save(vehicle);
    }

    /**
     * Update vehicle location
     */
    public Vehicle updateVehicleLocation(Long id, BigDecimal latitude, BigDecimal longitude, String cityName) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + id));
        
        vehicle.setCurrentLatitude(latitude);
        vehicle.setCurrentLongitude(longitude);
        
        if (cityName != null) {
             City city = cityRepository.findByName(cityName).orElse(null);
             if (city != null) {
                 vehicle.setCurrentCity(city);
             }
        }
        
        return vehicleRepository.save(vehicle);
    }
}
