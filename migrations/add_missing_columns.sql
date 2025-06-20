-- Add missing columns to user_promotions table
ALTER TABLE user_promotions 
ADD COLUMN IF NOT EXISTS bonus_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS wagering_requirement DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add comment to explain the columns
COMMENT ON COLUMN user_promotions.bonus_amount IS 'Bonus amount awarded to user (0 until deposit is made for deposit bonuses)';
COMMENT ON COLUMN user_promotions.wagering_requirement IS 'Total wagering requirement (0 until bonus is awarded)';
COMMENT ON COLUMN user_promotions.updated_at IS 'Last update timestamp'; 