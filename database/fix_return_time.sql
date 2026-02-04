-- Fix the return_time column to allow NULL values
-- This allows the backend to calculate return time automatically for ride-hailing bookings

ALTER TABLE bookings 
MODIFY COLUMN return_time TIMESTAMP NULL;

-- Verify the change
DESCRIBE bookings;
