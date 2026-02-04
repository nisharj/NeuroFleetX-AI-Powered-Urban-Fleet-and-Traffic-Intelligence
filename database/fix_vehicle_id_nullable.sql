-- Fix vehicle_id constraint to allow NULL for ride-hailing bookings
-- This migration makes vehicle_id nullable so that ride-hailing bookings
-- can be created without a vehicle (vehicle assigned later by driver)

USE neurofleetx;

-- Check current constraint
SELECT 
    COLUMN_NAME, 
    IS_NULLABLE, 
    COLUMN_TYPE,
    COLUMN_KEY
FROM 
    INFORMATION_SCHEMA.COLUMNS
WHERE 
    TABLE_SCHEMA = 'neurofleetx' 
    AND TABLE_NAME = 'bookings'
    AND COLUMN_NAME = 'vehicle_id';

-- Modify the column to allow NULL
ALTER TABLE bookings 
MODIFY COLUMN vehicle_id BIGINT NULL 
COMMENT 'NULL for ride-hailing (assigned later), required for rental';

-- Verify the change
SELECT 
    COLUMN_NAME, 
    IS_NULLABLE, 
    COLUMN_TYPE,
    COLUMN_KEY
FROM 
    INFORMATION_SCHEMA.COLUMNS
WHERE 
    TABLE_SCHEMA = 'neurofleetx' 
    AND TABLE_NAME = 'bookings'
    AND COLUMN_NAME = 'vehicle_id';

-- Success message
SELECT 'Migration completed: vehicle_id is now nullable' AS status;
