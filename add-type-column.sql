-- Add the missing type column to promotions table
ALTER TABLE promotions 
ADD COLUMN type TEXT DEFAULT 'deposit';

-- Update existing promotions to have the correct type
UPDATE promotions 
SET type = 'deposit' 
WHERE type IS NULL OR type = '';

-- Verify the column was added
SELECT id, name, type, bonus_percent, max_bonus_amount, min_deposit_amount, wagering_multiplier 
FROM promotions 
LIMIT 5; 