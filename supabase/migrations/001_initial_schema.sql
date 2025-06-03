-- Create profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    kyc_status TEXT DEFAULT 'pending',
    account_status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create wallets table
CREATE TABLE wallets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    currency TEXT DEFAULT 'AUD',
    balance DECIMAL(18,2) DEFAULT 0.00,
    locked_balance DECIMAL(18,2) DEFAULT 0.00,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create transactions table
CREATE TABLE transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    wallet_id UUID REFERENCES wallets(id) NOT NULL,
    type TEXT NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    currency TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    reference_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create game_sessions table
CREATE TABLE game_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    game_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    end_time TIMESTAMP WITH TIME ZONE,
    initial_balance DECIMAL(18,2) NOT NULL,
    final_balance DECIMAL(18,2),
    status TEXT DEFAULT 'active',
    metadata JSONB DEFAULT '{}'
);

-- Create admin_roles table
CREATE TABLE admin_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    permissions JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create admin_users table
CREATE TABLE admin_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    role_id UUID REFERENCES admin_roles(id) NOT NULL,
    status TEXT DEFAULT 'active',
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Profiles policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Wallets policies
CREATE POLICY "Users can view own wallet"
    ON wallets FOR SELECT
    USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions"
    ON transactions FOR SELECT
    USING (auth.uid() = user_id);

-- Game sessions policies
CREATE POLICY "Users can view own game sessions"
    ON game_sessions FOR SELECT
    USING (auth.uid() = user_id);

-- Admin policies (using is_admin() function)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users
        WHERE user_id = $1 AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin can view all tables
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view all wallets"
    ON wallets FOR SELECT
    USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view all transactions"
    ON transactions FOR SELECT
    USING (is_admin(auth.uid()));

-- Insert default admin role
INSERT INTO admin_roles (name, permissions)
VALUES ('super_admin', '{"all": true}'::jsonb);

-- Create functions for wallet operations
CREATE OR REPLACE FUNCTION update_wallet_balance(
    p_wallet_id UUID,
    p_amount DECIMAL,
    p_type TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    IF p_type = 'deposit' THEN
        UPDATE wallets
        SET balance = balance + p_amount,
            last_updated = TIMEZONE('utc', NOW())
        WHERE id = p_wallet_id;
    ELSIF p_type = 'withdraw' THEN
        UPDATE wallets
        SET balance = balance - p_amount,
            last_updated = TIMEZONE('utc', NOW())
        WHERE id = p_wallet_id
        AND balance >= p_amount;
    END IF;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 