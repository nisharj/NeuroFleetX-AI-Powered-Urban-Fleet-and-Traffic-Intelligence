-- ============================================
-- Migration: Add Ride-Hailing Support to Bookings
-- Date: 2026-01-29
-- Description: Make vehicle_id nullable and add requested_vehicle_type
-- ============================================

-- Add the requested_vehicle_type column
ALTER TABLE bookings 
ADD COLUMN requested_vehicle_type VARCHAR(50) 
COMMENT 'Requested vehicle type for ride-hailing bookings';

-- Make vehicle_id nullable
ALTER TABLE bookings 
MODIFY COLUMN vehicle_id BIGINT NULL 
COMMENT 'NULL for ride-hailing (assigned later), required for rental';

-- Drop the existing foreign key constraint
ALTER TABLE bookings 
DROP FOREIGN KEY bookings_ibfk_2;

-- Re-add the foreign key with SET NULL on delete
ALTER TABLE bookings 
ADD CONSTRAINT bookings_ibfk_2 
FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL;

-- Update any existing bookings with NULL vehicle_id to have a default requested type
-- (This is optional and depends on your data)
-- UPDATE bookings SET requested_vehicle_type = 'Sedan' WHERE vehicle_id IS NULL;

COMMIT;
