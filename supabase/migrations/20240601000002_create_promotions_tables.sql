-- Create promotions table
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('deposit_bonus', 'no_deposit_bonus', 'free_spins', 'cashback')),
  bonus_percentage NUMERIC(5,2) NOT NULL, -- e.g., 100.00 for 100% bonus
  max_bonus_amount NUMERIC(10,2) NOT NULL, -- maximum bonus amount
  min_deposit_amount NUMERIC(10,2) DEFAULT 0, -- minimum deposit required
  wagering_requirement NUMERIC(5,2) NOT NULL DEFAULT 30.0, -- e.g., 30.0 for 30x
  max_withdrawal_amount NUMERIC(10,2), -- for no-deposit bonuses
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_promotions table
CREATE TABLE IF NOT EXISTS public.user_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'forfeited', 'cancelled')),
  bonus_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  wagering_progress NUMERIC(10,2) NOT NULL DEFAULT 0, -- amount wagered toward requirement
  wagering_requirement NUMERIC(10,2) NOT NULL, -- total amount needed to wager
  max_withdrawal_amount NUMERIC(10,2), -- copied from promotion for no-deposit bonuses
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  forfeited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one active promotion per user per promotion type
  UNIQUE(user_id, promotion_id, status)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_promotions_active ON public.promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_type ON public.promotions(type);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON public.promotions(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_user_promotions_user_id ON public.user_promotions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_promotions_status ON public.user_promotions(status);
CREATE INDEX IF NOT EXISTS idx_user_promotions_active ON public.user_promotions(user_id, status) WHERE status = 'active';

-- Enable Row Level Security
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_promotions ENABLE ROW LEVEL SECURITY;

-- Create policies for promotions table
CREATE POLICY "Promotions are viewable by everyone"
  ON public.promotions FOR SELECT
  USING (is_active = TRUE AND (end_date IS NULL OR end_date > NOW()));

-- Users can view their own user_promotions
CREATE POLICY "Users can view own user_promotions"
  ON public.user_promotions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own user_promotions (when activating)
CREATE POLICY "Users can insert own user_promotions"
  ON public.user_promotions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own active user_promotions
CREATE POLICY "Users can update own active user_promotions"
  ON public.user_promotions FOR UPDATE
  USING (auth.uid() = user_id AND status = 'active');

-- Admin can view all promotions and user_promotions
CREATE POLICY "Admins can view all promotions"
  ON public.promotions FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view all user_promotions"
  ON public.user_promotions FOR SELECT
  USING (is_admin(auth.uid()));

-- Admin can manage promotions and user_promotions
CREATE POLICY "Admins can manage promotions"
  ON public.promotions FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage user_promotions"
  ON public.user_promotions FOR ALL
  USING (is_admin(auth.uid()));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON public.promotions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_promotions_updated_at BEFORE UPDATE ON public.user_promotions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 