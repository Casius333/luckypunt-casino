-- Add wallet policies for insert and update
CREATE POLICY "System services can insert wallets"
    ON wallets FOR INSERT
    WITH CHECK (true);  -- This will be restricted by service role auth

CREATE POLICY "Users can update own wallet through functions"
    ON wallets FOR UPDATE
    USING (auth.uid() = user_id);

-- Create a secure function to create/ensure wallet exists
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