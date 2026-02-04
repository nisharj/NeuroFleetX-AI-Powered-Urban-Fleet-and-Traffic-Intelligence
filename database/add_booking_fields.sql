-- ============================================
-- Add Missing Fields to Bookings Table
-- ============================================

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS pickup_address TEXT AFTER return_longitude,
ADD COLUMN IF NOT EXISTS drop_address TEXT AFTER pickup_address,
ADD COLUMN IF NOT EXISTS passenger_count INT AFTER drop_address,
ADD COLUMN IF NOT EXISTS contact_number VARCHAR(20) AFTER passenger_count,
ADD COLUMN IF NOT EXISTS booking_type VARCHAR(20) COMMENT 'now or scheduled' AFTER contact_number,
ADD COLUMN IF NOT EXISTS base_fare DECIMAL(10, 2) DEFAULT 0.00 AFTER booking_type,
ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10, 2) DEFAULT 0.00 AFTER base_fare,
ADD COLUMN IF NOT EXISTS rate_per_km DECIMAL(10, 2) DEFAULT 0.00 AFTER distance_km;
