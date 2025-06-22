-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_wallet_by_user_id(uuid);

-- Create the fixed function with properly qualified column names
CREATE OR REPLACE FUNCTION get_wallet_by_user_id(user_id_param uuid)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    balance numeric,
    bonus_balance numeric,
    total_wagered numeric,
    total_won numeric,
    total_lost numeric,
    updated_at timestamp with time zone
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id,
        w.user_id,
        w.balance,
        w.bonus_balance,
        w.total_wagered,
        w.total_won,
        w.total_lost,
        w.updated_at
    FROM wallets w
    WHERE w.user_id = user_id_param
    ORDER BY w.updated_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
