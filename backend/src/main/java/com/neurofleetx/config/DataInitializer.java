package com.neurofleetx.config;

import com.neurofleetx.model.City;
import com.neurofleetx.model.Route;
import com.neurofleetx.model.User;
import com.neurofleetx.repository.CityRepository;
import com.neurofleetx.repository.RouteRepository;
import com.neurofleetx.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CityRepository cityRepository;

    @Autowired
    private RouteRepository routeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Seed Admin User
        if (!userRepository.existsByEmail("admin@neurofleetx.com")) {
            User admin = new User();
            admin.setName("Admin User");
            admin.setEmail("admin@neurofleetx.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setPhone("1234567890");
            admin.setRole(User.Role.ADMIN);
            admin.setIsActive(true);
            admin.setApprovalStatus(User.ApprovalStatus.APPROVED);

            userRepository.save(admin);
            logger.info("Admin user seeded: admin@neurofleetx.com (password not logged)");
        }

        // Seed Customer User
        if (!userRepository.existsByEmail("customer@neurofleetx.com")) {
            User customer = new User();
            customer.setName("Jane Customer");
            customer.setEmail("customer@neurofleetx.com");
            customer.setPassword(passwordEncoder.encode("customer123"));
            customer.setPhone("0987654321");
            customer.setRole(User.Role.CUSTOMER);
            customer.setIsActive(true);
            customer.setApprovalStatus(User.ApprovalStatus.APPROVED);

            userRepository.save(customer);
            logger.info("Customer user seeded successfully: customer@neurofleetx.com");
        }

        // Seed Cities and Routes
        if (cityRepository.count() == 0) {
            City sf = new City();
            sf.setName("San Francisco");
            sf.setLatitude(new java.math.BigDecimal("37.7749"));
            sf.setLongitude(new java.math.BigDecimal("-122.4194"));
            sf.setState("CA");
            sf = cityRepository.save(sf);

            City oakland = new City();
            oakland.setName("Oakland");
            oakland.setLatitude(new java.math.BigDecimal("37.8044"));
            oakland.setLongitude(new java.math.BigDecimal("-122.2711"));
            oakland.setState("CA");
            oakland = cityRepository.save(oakland);

            City sj = new City();
            sj.setName("San Jose");
            sj.setLatitude(new java.math.BigDecimal("37.3382"));
            sj.setLongitude(new java.math.BigDecimal("-121.8863"));
            sj.setState("CA");
            sj = cityRepository.save(sj);

            // Routes for Dijkstra testing
            // SF -> Oakland (15km)
            createRoute(sf, oakland, 15.0);

            // Oakland -> SJ (40km)
            createRoute(oakland, sj, 40.0);

            // SF -> SJ (Direct 65km)
            createRoute(sf, sj, 65.0);

            logger.info("Cities and Routes seeded successfully");
        }
    }

    private void createRoute(City src, City dest, double dist) {
        Route r = new Route();
        r.setSourceCity(src);
        r.setDestinationCity(dest);
        r.setDistanceKm(java.math.BigDecimal.valueOf(dist));
        routeRepository.save(r);

        // Reverse
        Route r2 = new Route();
        r2.setSourceCity(dest);
        r2.setDestinationCity(src);
        r2.setDistanceKm(java.math.BigDecimal.valueOf(dist));
        routeRepository.save(r2);
    }
}
