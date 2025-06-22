-- Insert test deposit bonus promotion
-- Using correct column names from actual database schema

insert into promotions (
  name,
  description,
  type,
  is_active,
  bonus_percent,  -- Changed from bonus_percentage to bonus_percent
  max_bonus_amount,
  wagering_multiplier,
  max_withdrawal_cap,
  start_date,
  end_date
) values (
  'Test Deposit Bonus',
  '100% up to $100, 25x wagering',
  'deposit_bonus',
  true,
  100,  -- 100% bonus
  100,  -- Max $100 bonus
  25,   -- 25x wagering requirement
  1000, -- Max withdrawal cap
  now() - interval '1 day',  -- Started yesterday
  now() + interval '7 days'  -- Ends in 7 days
);

-- Verify the insertion
select 
  id,
  name,
  type,
  is_active,
  bonus_percent,
  max_bonus_amount,
  wagering_multiplier,
  start_date,
  end_date
from promotions 
where type = 'deposit_bonus' 
order by created_at desc 
limit 5; 