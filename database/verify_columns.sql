-- Verify that the new columns were added to the bookings table
DESCRIBE bookings;

-- Check if the specific columns exist
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_TYPE
FROM 
    INFORMATION_SCHEMA.COLUMNS
WHERE 
    TABLE_SCHEMA = 'neurofleetx' 
    AND TABLE_NAME = 'bookings'
    AND COLUMN_NAME IN (
        'pickup_address',
        'drop_address',
        'passenger_count',
        'contact_number',
        'booking_type',
        'base_fare',
        'distance_km',
        'rate_per_km'
    )
ORDER BY 
    COLUMN_NAME;
