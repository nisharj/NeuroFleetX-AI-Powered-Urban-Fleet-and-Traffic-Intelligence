package com.example.TraficIntelligence.service;

import java.util.List;
import java.util.Objects;
import java.util.Random;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.example.TraficIntelligence.model.Vehicle;
import com.example.TraficIntelligence.model.VehicleStatus;
import com.example.TraficIntelligence.repository.VehicleRepository;

@Service
public class VehicleTelemetryService {

    private final VehicleRepository vehicleRepository;
    private final Random random = new Random();

    public VehicleTelemetryService(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    @Scheduled(fixedRate = 5000)
    public void simulateTelemetryData() {

        List<Vehicle> vehicles = vehicleRepository.findAll();

        for (Vehicle vehicle : vehicles) {

            boolean updated = false;

            // 1️⃣ Auto-recovery from maintenance
            if (vehicle.getStatus() == VehicleStatus.MAINTENANCE) {

                if (random.nextInt(10) == 0) { // ~10% repair chance
                    if (vehicle.getBatteryLevel() != null) {
                        vehicle.setBatteryLevel(50);
                    }
                    if (vehicle.getFuelLevel() != null) {
                        vehicle.setFuelLevel(50);
                    }
                    vehicle.setStatus(VehicleStatus.AVAILABLE);
                    updated = true;
                }

                if (!Objects.equals(vehicle.getSpeed(), 0)) {
                    vehicle.setSpeed(0);
                    updated = true;
                }

                if (updated) {
                    vehicleRepository.save(vehicle);
                }
                continue;
            }

            boolean hasBattery = vehicle.getBatteryLevel() != null;
            boolean hasFuel = vehicle.getFuelLevel() != null;

            boolean batteryEmpty = hasBattery && vehicle.getBatteryLevel() == 0;
            boolean fuelEmpty = hasFuel && vehicle.getFuelLevel() == 0;

            // 2️⃣ Correct MAINTENANCE logic
            if (hasBattery && hasFuel && batteryEmpty && fuelEmpty ||
                hasBattery && !hasFuel && batteryEmpty ||
                hasFuel && !hasBattery && fuelEmpty) {

                vehicle.setStatus(VehicleStatus.MAINTENANCE);
                vehicle.setSpeed(0);
                vehicleRepository.save(vehicle);
                continue;
            }

            // 3️⃣ Speed generation
            int speed = random.nextInt(81);

            if (!Objects.equals(vehicle.getSpeed(), speed)) {
                vehicle.setSpeed(speed);
                updated = true;
            }

            // 4️⃣ Battery drain
            if (hasBattery) {
                int newBattery = Math.max(vehicle.getBatteryLevel() - random.nextInt(3), 0);
                if (!Objects.equals(vehicle.getBatteryLevel(), newBattery)) {
                    vehicle.setBatteryLevel(newBattery);
                    updated = true;
                }
            }

            // 5️⃣ Fuel drain
            if (hasFuel) {
                int newFuel = Math.max(vehicle.getFuelLevel() - random.nextInt(2), 0);
                if (!Objects.equals(vehicle.getFuelLevel(), newFuel)) {
                    vehicle.setFuelLevel(newFuel);
                    updated = true;
                }
            }

            // 6️⃣ GPS movement with geo-fencing
            if (vehicle.getLatitude() != null && vehicle.getLongitude() != null) {
                double latDelta = (random.nextDouble() - 0.5) / 1000;
                double lngDelta = (random.nextDouble() - 0.5) / 1000;

                double lat = clamp(vehicle.getLatitude() + latDelta, 8.0, 13.5);
                double lng = clamp(vehicle.getLongitude() + lngDelta, 76.0, 80.5);

                if (!Objects.equals(vehicle.getLatitude(), lat) ||
                    !Objects.equals(vehicle.getLongitude(), lng)) {
                    vehicle.setLatitude(lat);
                    vehicle.setLongitude(lng);
                    updated = true;
                }
            }

            // 7️⃣ Status based on speed
            VehicleStatus newStatus =
                speed > 0 ? VehicleStatus.IN_USE : VehicleStatus.AVAILABLE;

            if (vehicle.getStatus() != newStatus) {
                vehicle.setStatus(newStatus);
                updated = true;
            }

            if (updated) {
                vehicleRepository.save(vehicle);
            }
        }
    }

    private double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }
}
