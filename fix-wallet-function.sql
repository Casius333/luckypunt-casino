-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_wallet_by_user_id(uuid);

-- Create the corrected function with properly qualified column references
CREATE OR REPLACE FUNCTION get_wallet_by_user_id(user_id_param uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  balance numeric,
  currency text
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.user_id,
    w.balance,
    w.currency
  FROM wallets w
  WHERE w.user_id = user_id_param;
END;
$$; 