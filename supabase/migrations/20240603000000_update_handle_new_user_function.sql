-- Drop existing functions
DROP FUNCTION IF EXISTS public.ensure_player_record(uuid, text);
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create function to ensure player record exists with email as username
CREATE OR REPLACE FUNCTION public.ensure_player_record(p_user_id uuid, p_user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert into players with email as username
  insert into public.players (id, email, username)
  values (
    p_user_id,
    p_user_email,
    p_user_email  -- Use full email as username
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = EXCLUDED.email;  -- Update username to match email
  
  -- Create wallet if not exists
  insert into public.wallets (user_id, currency)
  values (p_user_id, 'AUD')
  ON CONFLICT DO NOTHING;
end;
$$;

-- Update the handle_new_user function to use the same logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
begin
  -- Call ensure_player_record to handle the insert with email as username
  PERFORM ensure_player_record(new.id, new.email);
  return new;
end;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user(); 