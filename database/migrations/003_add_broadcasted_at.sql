-- Migration: Add broadcasted_at to bookings (for accept latency measurement)

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'bookings' AND COLUMN_NAME = 'broadcasted_at');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE bookings ADD COLUMN broadcasted_at DATETIME NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;