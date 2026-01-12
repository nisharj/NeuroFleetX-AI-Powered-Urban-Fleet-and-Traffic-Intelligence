package com.example.TraficIntelligence.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import com.example.TraficIntelligence.model.Vehicle;
import com.example.TraficIntelligence.model.VehicleStatus;
import com.example.TraficIntelligence.repository.VehicleRepository;

@RestController
@RequestMapping("/api/fleet/vehicles")
@CrossOrigin(origins = "http://localhost:5173")
public class VehicleController {

    private final VehicleRepository vehicleRepository;

    public VehicleController(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    // ➕ Add vehicle
    @PostMapping
    public ResponseEntity<?> addVehicle(@Valid @RequestBody Vehicle vehicle) {

        if (vehicleRepository.findByVehicleNumber(vehicle.getVehicleNumber()).isPresent()) {
            return ResponseEntity.badRequest()
                    .body("Vehicle with this number already exists.");
        }

        vehicle.setStatus(
            vehicle.getStatus() != null ? vehicle.getStatus() : VehicleStatus.AVAILABLE
        );
        vehicle.setSpeed(0);

        return ResponseEntity.ok(vehicleRepository.save(vehicle));
    }

    // 📥 Get all vehicles
    @GetMapping
    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }

    // ✏️ Update vehicle
    @PutMapping("/{id}")
    public ResponseEntity<?> updateVehicle(
            @PathVariable Long id,
            @Valid @RequestBody Vehicle updatedVehicle) {

        return vehicleRepository.findById(id)
                .map(vehicle -> {

                    vehicle.setVehicleNumber(updatedVehicle.getVehicleNumber());
                    vehicle.setType(updatedVehicle.getType());
                    vehicle.setStatus(updatedVehicle.getStatus());
                    vehicle.setBatteryLevel(updatedVehicle.getBatteryLevel());
                    vehicle.setFuelLevel(updatedVehicle.getFuelLevel());
                    vehicle.setLatitude(updatedVehicle.getLatitude());
                    vehicle.setLongitude(updatedVehicle.getLongitude());

                    vehicleRepository.save(vehicle);
                    return ResponseEntity.ok(vehicle);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // 🗑 Delete vehicle (safe)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteVehicle(@PathVariable Long id) {

        if (!vehicleRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        vehicleRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
