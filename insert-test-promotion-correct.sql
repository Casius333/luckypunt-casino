-- Insert test deposit bonus promotion using the CORRECT schema
-- Based on actual database columns: id, name, description, bonus_percent, max_bonus_amount, 
-- min_deposit_amount, wagering_multiplier, is_active, start_at, end_at, created_at, 
-- max_withdrawal_amount, type

insert into promotions (
  name,
  description,
  type,
  is_active,
  bonus_percent,
  max_bonus_amount,
  min_deposit_amount,
  wagering_multiplier,
  max_withdrawal_amount,
  start_at,
  end_at
) values (
  'Test Deposit Bonus',
  '100% up to $100, 25x wagering requirement',
  'deposit_bonus',
  true,
  100,  -- 100% bonus
  100,  -- Max $100 bonus
  10,   -- Min $10 deposit
  25,   -- 25x wagering requirement
  1000, -- Max withdrawal amount
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
  start_at,
  end_at
from promotions 
where name = 'Test Deposit Bonus'
order by created_at desc
limit 1; 