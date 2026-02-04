-- Update phone column length in users table
-- This fixes the issue where phone numbers longer than 20 characters were being truncated

ALTER TABLE users MODIFY COLUMN phone VARCHAR(50);

-- Verify the change
DESCRIBE users;
