-- Insert sample promotions
INSERT INTO public.promotions (name, description, type, bonus_percentage, max_bonus_amount, min_deposit_amount, wagering_requirement, max_withdrawal_amount, is_active) VALUES
-- Deposit Bonus Promotions
('Welcome Bonus', 'Get 100% bonus on your first deposit up to $500', 'deposit_bonus', 100.00, 500.00, 20.00, 30.0, NULL, true),
('Reload Bonus', 'Get 50% bonus on your deposit up to $200', 'deposit_bonus', 50.00, 200.00, 10.00, 25.0, NULL, true),
('High Roller Bonus', 'Get 75% bonus on deposits over $1000 up to $2000', 'deposit_bonus', 75.00, 2000.00, 1000.00, 35.0, NULL, true),

-- No Deposit Bonus Promotions
('Free $10 Bonus', 'Get $10 free bonus to try our games', 'no_deposit_bonus', 0.00, 10.00, 0.00, 50.0, 50.00, true),
('New Player Free Spins', 'Get 50 free spins on Sweet Bonanza', 'free_spins', 0.00, 0.00, 0.00, 40.0, 100.00, true),

-- Cashback Promotion
('Weekly Cashback', 'Get 10% cashback on your losses this week', 'cashback', 10.00, 500.00, 0.00, 1.0, NULL, true)
ON CONFLICT DO NOTHING; 