package com.neurofleetx.controller;

import com.neurofleetx.dto.MessageResponse;
import com.neurofleetx.model.Vehicle;
import com.neurofleetx.service.VehicleService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@CrossOrigin(origins = "*", maxAge = 3600)
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService){
        this.vehicleService = vehicleService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'CUSTOMER')")
    public ResponseEntity<List<Vehicle>> getAllVehicles() {
        List<Vehicle> vehicles = vehicleService.getAllVehicles();
        return ResponseEntity.ok(vehicles);
    }


    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'CUSTOMER')")
    public ResponseEntity<?> getVehicleById(@PathVariable Long id) {
        return vehicleService.getVehicleById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    public ResponseEntity<?> createVehicle(@Valid @RequestBody Vehicle vehicle) {
        try {
            Vehicle createdVehicle = vehicleService.createVehicle(vehicle);
            return ResponseEntity.ok(createdVehicle);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }


    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    public ResponseEntity<?> updateVehicle(@PathVariable Long id, @Valid @RequestBody Vehicle vehicleDetails) {
        try {
            Vehicle updatedVehicle = vehicleService.updateVehicle(id, vehicleDetails);
            return ResponseEntity.ok(updatedVehicle);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

   
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteVehicle(@PathVariable Long id) {
        try {
            vehicleService.deleteVehicle(id);
            return ResponseEntity.ok(new MessageResponse("Vehicle deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

  
    @GetMapping("/available")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'CUSTOMER')")
    public ResponseEntity<List<Vehicle>> getAvailableVehicles() {
        List<Vehicle> vehicles = vehicleService.getAvailableVehicles();
        return ResponseEntity.ok(vehicles);
    }


    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    public ResponseEntity<List<Vehicle>> getVehiclesByStatus(@PathVariable String status) {
        try {
            Vehicle.VehicleStatus vehicleStatus = Vehicle.VehicleStatus.valueOf(status.toUpperCase());
            List<Vehicle> vehicles = vehicleService.getVehiclesByStatus(vehicleStatus);
            return ResponseEntity.ok(vehicles);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

   
    @GetMapping("/type/{type}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'CUSTOMER')")
    public ResponseEntity<List<Vehicle>> getVehiclesByType(@PathVariable String type) {
        try {
            Vehicle.VehicleType vehicleType = Vehicle.VehicleType.valueOf(type.toUpperCase());
            List<Vehicle> vehicles = vehicleService.getVehiclesByType(vehicleType);
            return ResponseEntity.ok(vehicles);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/city/{city}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'CUSTOMER')")
    public ResponseEntity<List<Vehicle>> getVehiclesByCity(@PathVariable String city) {
        List<Vehicle> vehicles = vehicleService.getVehiclesByCity(city);
        return ResponseEntity.ok(vehicles);
    }

    
    @GetMapping("/maintenance")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    public ResponseEntity<List<Vehicle>> getVehiclesNeedingMaintenance() {
        List<Vehicle> vehicles = vehicleService.getVehiclesNeedingMaintenance();
        return ResponseEntity.ok(vehicles);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER')")
    public ResponseEntity<?> updateVehicleStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            Vehicle.VehicleStatus vehicleStatus = Vehicle.VehicleStatus.valueOf(status.toUpperCase());
            Vehicle updatedVehicle = vehicleService.updateVehicleStatus(id, vehicleStatus);
            return ResponseEntity.ok(updatedVehicle);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Invalid status"));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    
    @PatchMapping("/{id}/location")
    @PreAuthorize("hasAnyRole('ADMIN', 'FLEET_MANAGER', 'DRIVER')")
    public ResponseEntity<?> updateVehicleLocation(
            @PathVariable Long id,
            @RequestParam BigDecimal latitude,
            @RequestParam BigDecimal longitude,
            @RequestParam String city) {
        try {
            Vehicle updatedVehicle = vehicleService.updateVehicleLocation(id, latitude, longitude, city);
            return ResponseEntity.ok(updatedVehicle);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
