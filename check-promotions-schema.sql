-- Check the actual promotions table schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'promotions' 
ORDER BY ordinal_position;

-- Also check if the table exists and show a sample row
SELECT * FROM promotions LIMIT 1; 