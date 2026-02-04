-- Quick fix for booking error
-- Execute this in MySQL Workbench or command line

USE neurofleetx;

ALTER TABLE bookings MODIFY COLUMN return_time TIMESTAMP NULL;

SELECT 'Database fix applied successfully!' AS status;
