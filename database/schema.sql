-- ============================================
-- NeuroFleetX Database Schema
-- MySQL 8.0+
-- ============================================

-- Drop existing tables (for clean setup)
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS analytics_daily;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS cities;
DROP TABLE IF EXISTS users;

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'CUSTOMER', 'DRIVER', 'FLEET_MANAGER') NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. CITIES TABLE (Reference Data)
-- ============================================
CREATE TABLE cities (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'USA',
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_coordinates (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. VEHICLES TABLE
-- ============================================
CREATE TABLE vehicles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    vehicle_code VARCHAR(20) NOT NULL UNIQUE COMMENT 'e.g., VH-0001',
    name VARCHAR(255) NOT NULL,
    type ENUM('EV', 'Sedan', 'SUV', 'Van', 'Bike') NOT NULL,
    model VARCHAR(100),
    manufacturer VARCHAR(100),
    year INT,
    seats INT NOT NULL,
    fuel_type ENUM('Electric', 'Petrol', 'Diesel', 'Hybrid') NOT NULL,
    
    -- Location & Status
    current_city_id BIGINT,
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    status ENUM('AVAILABLE', 'BOOKED', 'IN_USE', 'MAINTENANCE', 'OFFLINE') DEFAULT 'AVAILABLE',
    
    -- Battery/Fuel Level
    battery_level INT DEFAULT 100 COMMENT 'Percentage 0-100',
    
    -- Pricing
    price_per_hour DECIMAL(10, 2) NOT NULL,
    
    -- Features (JSON array)
    features JSON COMMENT '["GPS", "AC", "Bluetooth", "USB Charging"]',
    
    -- Rating
    rating DECIMAL(3, 2) DEFAULT 0.00 COMMENT 'Average rating 0.00-5.00',
    total_ratings INT DEFAULT 0,
    
    -- AI Recommendation Score
    ai_score DECIMAL(5, 4) DEFAULT 0.0000 COMMENT 'AI recommendation score 0-1',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    
    FOREIGN KEY (current_city_id) REFERENCES cities(id) ON DELETE SET NULL,
    INDEX idx_vehicle_code (vehicle_code),
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_city (current_city_id),
    INDEX idx_availability (status, current_city_id),
    INDEX idx_ai_score (ai_score DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. BOOKINGS TABLE
-- ============================================
CREATE TABLE bookings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    booking_code VARCHAR(20) NOT NULL UNIQUE COMMENT 'e.g., BK-20260122-0001',
    
    -- References
    user_id BIGINT NOT NULL,
    vehicle_id BIGINT NULL COMMENT 'NULL for ride-hailing (assigned later), required for rental',
    requested_vehicle_type VARCHAR(50) COMMENT 'Requested vehicle type for ride-hailing bookings',
    
    -- Booking Times
    pickup_time TIMESTAMP NOT NULL,
    return_time TIMESTAMP NULL,
    actual_return_time TIMESTAMP NULL,
    
    -- Location
    pickup_city_id BIGINT,
    return_city_id BIGINT,
    pickup_latitude DECIMAL(10, 8),
    pickup_longitude DECIMAL(11, 8),
    return_latitude DECIMAL(10, 8),
    return_longitude DECIMAL(11, 8),
    pickup_address TEXT,
    drop_address TEXT,
    passenger_count INT,
    contact_number VARCHAR(20),
    booking_type VARCHAR(20) COMMENT 'now or scheduled',
    
    -- Pricing
    base_fare DECIMAL(10, 2) DEFAULT 0.00,
    distance_km DECIMAL(10, 2) DEFAULT 0.00,
    rate_per_km DECIMAL(10, 2) DEFAULT 0.00,
    hourly_rate DECIMAL(10, 2) NOT NULL,
    estimated_hours DECIMAL(10, 2) NOT NULL,
    estimated_cost DECIMAL(10, 2) NOT NULL,
    actual_cost DECIMAL(10, 2),
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    total_cost DECIMAL(10, 2) NOT NULL,
    
    -- Status
    status ENUM('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
    payment_status ENUM('PENDING', 'PAID', 'REFUNDED', 'FAILED') DEFAULT 'PENDING',
    
    -- Rating & Feedback
    customer_rating INT COMMENT '1-5 stars',
    customer_feedback TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP NULL,
    cancellation_reason TEXT,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    FOREIGN KEY (pickup_city_id) REFERENCES cities(id) ON DELETE SET NULL,
    FOREIGN KEY (return_city_id) REFERENCES cities(id) ON DELETE SET NULL,
    
    INDEX idx_booking_code (booking_code),
    INDEX idx_user (user_id),
    INDEX idx_vehicle (vehicle_id),
    INDEX idx_status (status),
    INDEX idx_pickup_time (pickup_time),
    INDEX idx_created_at (created_at),
    INDEX idx_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. ANALYTICS_DAILY TABLE
-- ============================================
CREATE TABLE analytics_daily (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    city_id BIGINT,
    
    -- Revenue Metrics
    total_revenue DECIMAL(12, 2) DEFAULT 0.00,
    total_bookings INT DEFAULT 0,
    completed_bookings INT DEFAULT 0,
    cancelled_bookings INT DEFAULT 0,
    
    -- Fleet Metrics
    total_vehicles INT DEFAULT 0,
    active_vehicles INT DEFAULT 0,
    vehicles_in_use INT DEFAULT 0,
    vehicles_in_maintenance INT DEFAULT 0,
    
    -- Customer Metrics
    new_customers INT DEFAULT 0,
    returning_customers INT DEFAULT 0,
    
    -- Performance Metrics
    average_booking_duration DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Hours',
    average_revenue_per_booking DECIMAL(10, 2) DEFAULT 0.00,
    fleet_utilization_rate DECIMAL(5, 2) DEFAULT 0.00 COMMENT 'Percentage',
    
    -- Trip Density (for heatmap)
    total_trips INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE,
    UNIQUE KEY unique_date_city (date, city_id),
    INDEX idx_date (date),
    INDEX idx_city (city_id),
    INDEX idx_date_city (date, city_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SEED DATA
-- ============================================

-- Insert Cities
INSERT INTO cities (name, state, country, latitude, longitude, timezone) VALUES
('New York', 'New York', 'USA', 40.7128, -74.0060, 'America/New_York'),
('Los Angeles', 'California', 'USA', 34.0522, -118.2437, 'America/Los_Angeles'),
('Chicago', 'Illinois', 'USA', 41.8781, -87.6298, 'America/Chicago'),
('Houston', 'Texas', 'USA', 29.7604, -95.3698, 'America/Chicago'),
('Phoenix', 'Arizona', 'USA', 33.4484, -112.0740, 'America/Phoenix'),
('Philadelphia', 'Pennsylvania', 'USA', 39.9526, -75.1652, 'America/New_York'),
('San Antonio', 'Texas', 'USA', 29.4241, -98.4936, 'America/Chicago'),
('San Diego', 'California', 'USA', 32.7157, -117.1611, 'America/Los_Angeles');

-- Insert Sample Vehicles
INSERT INTO vehicles (vehicle_code, name, type, seats, fuel_type, current_city_id, battery_level, price_per_hour, features, rating, total_ratings, ai_score, status) VALUES
('VH-0001', 'Tesla Model 3 Premium', 'EV', 5, 'Electric', 1, 95, 25.00, '["GPS", "AC", "Bluetooth", "USB Charging", "Autopilot"]', 4.8, 120, 0.9500, 'AVAILABLE'),
('VH-0002', 'BMW 5 Series Deluxe', 'Sedan', 5, 'Petrol', 1, 80, 30.00, '["GPS", "AC", "Bluetooth", "Leather Seats"]', 4.6, 85, 0.8200, 'AVAILABLE'),
('VH-0003', 'Toyota RAV4 SUV', 'SUV', 7, 'Hybrid', 2, 90, 28.00, '["GPS", "AC", "Bluetooth", "USB Charging"]', 4.7, 95, 0.8800, 'AVAILABLE'),
('VH-0004', 'Mercedes Sprinter Van', 'Van', 8, 'Diesel', 2, 75, 35.00, '["GPS", "AC", "Bluetooth"]', 4.5, 60, 0.7500, 'AVAILABLE'),
('VH-0005', 'Harley Davidson Bike', 'Bike', 2, 'Petrol', 3, 85, 15.00, '["GPS", "USB Charging"]', 4.9, 150, 0.9200, 'AVAILABLE'),
('VH-0006', 'Audi A6 Comfort', 'Sedan', 5, 'Petrol', 3, 88, 32.00, '["GPS", "AC", "Bluetooth", "Sunroof"]', 4.7, 78, 0.8600, 'AVAILABLE'),
('VH-0007', 'Nissan Leaf EV', 'EV', 5, 'Electric', 4, 92, 22.00, '["GPS", "AC", "Bluetooth"]', 4.4, 92, 0.8000, 'AVAILABLE'),
('VH-0008', 'Ford Explorer SUV', 'SUV', 7, 'Petrol', 4, 78, 29.00, '["GPS", "AC", "Bluetooth", "4WD"]', 4.6, 88, 0.8400, 'AVAILABLE'),
('VH-0009', 'Honda Civic Standard', 'Sedan', 5, 'Petrol', 5, 82, 20.00, '["GPS", "AC", "Bluetooth"]', 4.3, 105, 0.7800, 'AVAILABLE'),
('VH-0010', 'Chevrolet Bolt EV', 'EV', 5, 'Electric', 5, 96, 24.00, '["GPS", "AC", "Bluetooth", "USB Charging"]', 4.5, 110, 0.8500, 'AVAILABLE'),
('VH-0011', 'Yamaha MT-09 Bike', 'Bike', 2, 'Petrol', 6, 90, 12.00, '["GPS"]', 4.8, 140, 0.9000, 'AVAILABLE'),
('VH-0012', 'Volkswagen Transporter Van', 'Van', 8, 'Diesel', 6, 70, 33.00, '["GPS", "AC"]', 4.4, 55, 0.7600, 'AVAILABLE');

-- Insert Sample Users (passwords are hashed 'password123')
INSERT INTO users (email, password_hash, name, role, phone) VALUES
('admin@neurofleetx.com', '$2a$10$rO5bNCiKbZEqzXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'Admin User', 'ADMIN', '+1-555-0001'),
('john.customer@email.com', '$2a$10$rO5bNCiKbZEqzXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'John Customer', 'CUSTOMER', '+1-555-0002'),
('jane.driver@email.com', '$2a$10$rO5bNCiKbZEqzXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'Jane Driver', 'DRIVER', '+1-555-0003'),
('mike.manager@email.com', '$2a$10$rO5bNCiKbZEqzXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'Mike Manager', 'FLEET_MANAGER', '+1-555-0004');

-- Insert Sample Analytics Data (Last 7 days for New York)
INSERT INTO analytics_daily (date, city_id, total_revenue, total_bookings, completed_bookings, total_trips) VALUES
(CURDATE() - INTERVAL 6 DAY, 1, 4200.00, 45, 42, 1250),
(CURDATE() - INTERVAL 5 DAY, 1, 5100.00, 52, 50, 1280),
(CURDATE() - INTERVAL 4 DAY, 1, 4800.00, 48, 46, 1220),
(CURDATE() - INTERVAL 3 DAY, 1, 6200.00, 58, 55, 1350),
(CURDATE() - INTERVAL 2 DAY, 1, 7800.00, 68, 65, 1420),
(CURDATE() - INTERVAL 1 DAY, 1, 8900.00, 75, 72, 1480),
(CURDATE(), 1, 6400.00, 62, 58, 1380);

-- Insert Sample Analytics Data for other cities
INSERT INTO analytics_daily (date, city_id, total_revenue, total_bookings, completed_bookings, total_trips) VALUES
(CURDATE(), 2, 3800.00, 42, 40, 980),
(CURDATE(), 3, 2900.00, 35, 33, 750),
(CURDATE(), 4, 2400.00, 28, 26, 620),
(CURDATE(), 5, 2100.00, 24, 22, 540),
(CURDATE(), 6, 1900.00, 22, 20, 480),
(CURDATE(), 7, 1600.00, 19, 18, 420),
(CURDATE(), 8, 1500.00, 18, 17, 390);
