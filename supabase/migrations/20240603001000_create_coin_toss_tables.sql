-- Create coin_toss_sessions table
CREATE TABLE IF NOT EXISTS public.coin_toss_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES public.players(id),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    end_time TIMESTAMP WITH TIME ZONE,
    initial_balance NUMERIC NOT NULL,
    final_balance NUMERIC,
    total_bets INTEGER DEFAULT 0,
    total_wins INTEGER DEFAULT 0,
    total_losses INTEGER DEFAULT 0,
    net_profit_loss NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create coin_toss_rounds table
CREATE TABLE IF NOT EXISTS public.coin_toss_rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.coin_toss_sessions(id),
    bet_amount NUMERIC NOT NULL CHECK (bet_amount > 0),
    player_choice TEXT NOT NULL CHECK (player_choice IN ('heads', 'tails')),
    result TEXT NOT NULL CHECK (result IN ('heads', 'tails')),
    is_win BOOLEAN NOT NULL,
    payout_amount NUMERIC NOT NULL,
    player_balance_before NUMERIC NOT NULL,
    player_balance_after NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_coin_toss_sessions_player_id ON public.coin_toss_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_coin_toss_sessions_status ON public.coin_toss_sessions(status);
CREATE INDEX IF NOT EXISTS idx_coin_toss_rounds_session_id ON public.coin_toss_rounds(session_id);

-- Add RLS policies
ALTER TABLE public.coin_toss_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_toss_rounds ENABLE ROW LEVEL SECURITY;

-- Players can only view their own sessions
CREATE POLICY "Players can view own sessions"
    ON public.coin_toss_sessions
    FOR SELECT
    TO authenticated
    USING (player_id = auth.uid());

-- Players can only insert their own sessions
CREATE POLICY "Players can insert own sessions"
    ON public.coin_toss_sessions
    FOR INSERT
    TO authenticated
    WITH CHECK (player_id = auth.uid());

-- Players can only update their own active sessions
CREATE POLICY "Players can update own active sessions"
    ON public.coin_toss_sessions
    FOR UPDATE
    TO authenticated
    USING (player_id = auth.uid() AND status = 'active');

-- Players can view rounds from their own sessions
CREATE POLICY "Players can view own rounds"
    ON public.coin_toss_rounds
    FOR SELECT
    TO authenticated
    USING (session_id IN (
        SELECT id FROM public.coin_toss_sessions 
        WHERE player_id = auth.uid()
    ));

-- Players can insert rounds in their active sessions
CREATE POLICY "Players can insert rounds in active sessions"
    ON public.coin_toss_rounds
    FOR INSERT
    TO authenticated
    WITH CHECK (session_id IN (
        SELECT id FROM public.coin_toss_sessions 
        WHERE player_id = auth.uid() 
        AND status = 'active'
    )); 