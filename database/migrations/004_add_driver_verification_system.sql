-- Migration: Add Driver Verification System
-- Description: Creates driver_verifications table for driver approval workflow
-- Date: 2026-02-12

CREATE TABLE IF NOT EXISTS driver_verifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    driver_id BIGINT NOT NULL UNIQUE,
    
    -- License Information
    license_number VARCHAR(100) NOT NULL,
    license_expiry_date DATE,
    license_state VARCHAR(100),
    license_country VARCHAR(100) DEFAULT 'India',
    
    -- Vehicle Information
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_year INT,
    vehicle_color VARCHAR(50),
    vehicle_plate_number VARCHAR(50),
    vehicle_type VARCHAR(50),
    vehicle_capacity INT,
    
    -- Insurance Information
    insurance_company VARCHAR(200),
    insurance_policy_number VARCHAR(100),
    insurance_expiry_date DATE,
    
    -- Documents (file paths or URLs)
    license_document_url VARCHAR(500),
    vehicle_rc_document_url VARCHAR(500),
    insurance_document_url VARCHAR(500),
    photo_url VARCHAR(500),
    
    -- Additional Information
    experience_years INT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_number VARCHAR(20),
    notes TEXT,
    
    -- Verification Status
    verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING_SUBMISSION',
    admin_remarks TEXT,
    approved_by_id BIGINT,
    approved_at TIMESTAMP NULL,
    rejected_at TIMESTAMP NULL,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_driver_id (driver_id),
    INDEX idx_verification_status (verification_status),
    INDEX idx_approved_by (approved_by_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comments
ALTER TABLE driver_verifications COMMENT = 'Driver verification and approval data';

-- Verification status values:
-- PENDING_SUBMISSION: Initial state, waiting for driver to submit details
-- PENDING_APPROVAL: Details submitted, waiting for admin review
-- APPROVED: Approved by admin, driver can accept rides
-- REJECTED: Rejected by admin
-- RESUBMISSION_REQUIRED: Admin requested changes
