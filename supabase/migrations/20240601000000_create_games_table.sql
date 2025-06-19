-- Enable pgcrypto for gen_random_uuid if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create games table
CREATE TABLE IF NOT EXISTS public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id INT, -- external game ID from API
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('slots', 'table', 'live', 'plinko', 'jackpot', 'other')),
  provider TEXT,
  image TEXT,
  image_preview TEXT,
  wager_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for fast lookup by provider_id
CREATE INDEX IF NOT EXISTS idx_games_provider_id ON public.games(provider_id);

-- Add index for filtering by type
CREATE INDEX IF NOT EXISTS idx_games_type ON public.games(type);

-- Add index for active games
CREATE INDEX IF NOT EXISTS idx_games_active ON public.games(is_active);

-- Enable Row Level Security
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Create policies for games table
CREATE POLICY "Games are viewable by everyone"
  ON public.games FOR SELECT
  USING (is_active = TRUE);

-- Admin can view all games (including inactive)
CREATE POLICY "Admins can view all games"
  ON public.games FOR SELECT
  USING (is_admin(auth.uid()));

-- Admin can insert/update/delete games
CREATE POLICY "Admins can manage games"
  ON public.games FOR ALL
  USING (is_admin(auth.uid())); 