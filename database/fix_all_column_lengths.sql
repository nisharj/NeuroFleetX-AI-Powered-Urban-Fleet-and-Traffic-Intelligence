-- Fix all column length issues in the users table
-- This script will permanently fix the 500 error

USE neurofleetx;

-- 1. Increase phone column length
ALTER TABLE users MODIFY COLUMN phone VARCHAR(50);

-- 2. Increase approval_status column length
ALTER TABLE users MODIFY COLUMN approval_status VARCHAR(50);

-- 3. Increase address column length (in case it's too short)
ALTER TABLE users MODIFY COLUMN address VARCHAR(500);

-- 4. Increase license_number column length
ALTER TABLE users MODIFY COLUMN license_number VARCHAR(100);

-- Verify the changes
DESCRIBE users;

SELECT 'Database schema updated successfully!' AS status;
