package com.neurofleetx;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@EnableJpaAuditing
@EnableScheduling
@SpringBootApplication
public class NeuroFleetXApplication {

    private static final Logger logger = LoggerFactory.getLogger(NeuroFleetXApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(NeuroFleetXApplication.class, args);
        logger.info("NeuroFleetX Backend API Started - Version: 1.0.0, Port: 8080, Base: /api");
    }
}
