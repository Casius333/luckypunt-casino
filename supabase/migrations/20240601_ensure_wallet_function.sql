-- Create a secure function to ensure wallet exists
CREATE OR REPLACE FUNCTION ensure_user_wallet(
    user_id UUID,
    currency TEXT DEFAULT 'AUD'
) RETURNS UUID AS $$
DECLARE
    wallet_id UUID;
BEGIN
    -- First try to get existing wallet
    SELECT id INTO wallet_id
    FROM wallets
    WHERE wallets.user_id = ensure_user_wallet.user_id
    LIMIT 1;
    
    -- If no wallet exists, create one
    IF wallet_id IS NULL THEN
        INSERT INTO wallets (user_id, currency)
        VALUES (ensure_user_wallet.user_id, ensure_user_wallet.currency)
        RETURNING id INTO wallet_id;
    END IF;
    
    RETURN wallet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION ensure_user_wallet TO authenticated;

-- Add policy for the function to insert wallets
CREATE POLICY "Allow ensure_user_wallet to create wallets"
    ON wallets FOR INSERT
    WITH CHECK (auth.uid() = user_id); 