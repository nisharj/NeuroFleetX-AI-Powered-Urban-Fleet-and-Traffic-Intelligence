package com.neurofleetx;

import com.neurofleetx.model.City;
import com.neurofleetx.model.Vehicle;
import com.neurofleetx.repository.CityRepository;
import com.neurofleetx.repository.VehicleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.util.Arrays;

@Configuration
public class DataSeeder {

    private static final Logger logger = LoggerFactory.getLogger(DataSeeder.class);

    @Bean
    CommandLineRunner initDatabase(CityRepository cityRepository, VehicleRepository vehicleRepository) {
        return args -> {
            // Seed Cities
            if (cityRepository.count() == 0) {
                City ny = new City();
                ny.setName("New York");
                ny.setLatitude(new BigDecimal("40.7128"));
                ny.setLongitude(new BigDecimal("-74.0060"));
                ny.setState("NY");
                ny.setTimezone("America/New_York");

                City sf = new City();
                sf.setName("San Francisco");
                sf.setLatitude(new BigDecimal("37.7749"));
                sf.setLongitude(new BigDecimal("-122.4194"));
                sf.setState("CA");
                sf.setTimezone("America/Los_Angeles");

                City austin = new City();
                austin.setName("Austin");
                austin.setLatitude(new BigDecimal("30.2672"));
                austin.setLongitude(new BigDecimal("-97.7431"));
                austin.setState("TX");
                austin.setTimezone("America/Chicago");

                cityRepository.saveAll(Arrays.asList(ny, sf, austin));
                logger.info("Seeded Cities: NY, SF, Austin");
            }

            // Seed Vehicles
            if (vehicleRepository.count() == 0) {
                City ny = cityRepository.findByName("New York").orElse(null);
                City sf = cityRepository.findByName("San Francisco").orElse(null);

                Vehicle v1 = new Vehicle();
                v1.setVehicleCode("VH-001");
                v1.setName("Tesla Model 3");
                v1.setType(Vehicle.VehicleType.ELECTRICAL_VEHICLE);
                v1.setFuelType(Vehicle.FuelType.ELECTRIC);
                v1.setStatus(Vehicle.VehicleStatus.AVAILABLE);
                v1.setBatteryLevel(85);
                v1.setSeats(5);
                v1.setPricePerHour(new BigDecimal("25.00"));
                v1.setCurrentCity(ny);
                v1.setCurrentLatitude(new BigDecimal("40.7128"));
                v1.setCurrentLongitude(new BigDecimal("-74.0060"));
                v1.setManufacturer("Tesla");
                v1.setModel("Model 3");
                v1.setYear(2024);
                v1.setFeatures("[\"GPS\", \"Autopilot\", \"Heated Seats\"]");
                v1.setMileage(1200);

                Vehicle v2 = new Vehicle();
                v2.setVehicleCode("VH-002");
                v2.setName("Ford Mustang Mach-E");
                v2.setType(Vehicle.VehicleType.SUV);
                v2.setFuelType(Vehicle.FuelType.ELECTRIC);
                v2.setStatus(Vehicle.VehicleStatus.IN_USE);
                v2.setBatteryLevel(45);
                v2.setSeats(5);
                v2.setPricePerHour(new BigDecimal("28.00"));
                v2.setCurrentCity(sf);
                v2.setCurrentLatitude(new BigDecimal("37.7749"));
                v2.setCurrentLongitude(new BigDecimal("-122.4194"));
                v2.setManufacturer("Ford");
                v2.setModel("Mach-E");
                v2.setYear(2023);
                v2.setFeatures("[\"GPS\", \"Android Auto\", \"Sunroof\"]");
                v2.setMileage(5000);

                Vehicle v3 = new Vehicle();
                v3.setVehicleCode("VH-003");
                v3.setName("Toyota Camry Hybrid");
                v3.setType(Vehicle.VehicleType.SEDAN);
                v3.setFuelType(Vehicle.FuelType.HYBRID);
                v3.setStatus(Vehicle.VehicleStatus.MAINTENANCE);
                v3.setBatteryLevel(100); 
                v3.setSeats(5);
                v3.setPricePerHour(new BigDecimal("18.00"));
                v3.setCurrentCity(ny);
                v3.setCurrentLatitude(new BigDecimal("40.7300")); 
                v3.setCurrentLongitude(new BigDecimal("-73.9900"));
                v3.setManufacturer("Toyota");
                v3.setModel("Camry");
                v3.setYear(2022);
                v3.setEngineHealth(60); // Requires maintenance
                v3.setFeatures("[\"Bluetooth\", \"Backup Camera\"]");
                v3.setMileage(25000);

                vehicleRepository.saveAll(Arrays.asList(v1, v2, v3));
                logger.info("Seeded Vehicles: VH-001, VH-002, VH-003");
            }
        };
    }
}
