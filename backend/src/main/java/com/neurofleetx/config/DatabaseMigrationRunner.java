package com.neurofleetx.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Runs on startup BEFORE other CommandLineRunners to fix legacy enum values
 * in the database that don't match the current Java enum definitions.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class DatabaseMigrationRunner implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseMigrationRunner.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            logger.info("Running database migration: fixing approval_status enum values...");

            int updated = 0;
            updated += jdbcTemplate.update(
                    "UPDATE users SET approval_status = 'APPROVED' WHERE approval_status = 'APPROVED_DRIVER'");
            updated += jdbcTemplate.update(
                    "UPDATE users SET approval_status = 'PENDING_ACCOUNT_APPROVAL' WHERE approval_status = 'PENDING'");
            updated += jdbcTemplate.update(
                    "UPDATE users SET approval_status = 'PENDING_ACCOUNT_APPROVAL' WHERE approval_status = 'WAITING'");
            updated += jdbcTemplate.update(
                    "UPDATE users SET approval_status = 'ACCOUNT_APPROVED' WHERE approval_status = 'PENDING_APPROVAL'");

            if (updated > 0) {
                logger.info("Database migration: updated {} rows with legacy approval_status values", updated);
            } else {
                logger.info("Database migration: no legacy approval_status values found, skipping");
            }
        } catch (Exception e) {
            logger.warn("Database migration warning (non-fatal): {}", e.getMessage());
        }
    }
}
