-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  username text unique not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create wallets table
create table if not exists public.wallets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade unique not null,
  currency text not null check (currency = 'AUD'),
  balance decimal(10,2) not null default 0.00 check (balance >= 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable real-time for wallets table
alter publication supabase_realtime add table wallets;

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- Wallet policies
create policy "Users can view own wallet"
  on wallets for select
  using ( auth.uid() = user_id );

create policy "Users can update own wallet"
  on wallets for update
  using ( auth.uid() = user_id );

-- Function to handle new user profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, username)
  values (new.id, new.email, new.email);
  
  insert into public.wallets (user_id, currency)
  values (new.id, 'AUD');
  
  return new;
end;
$$;

-- Trigger for new user profiles
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create functions for handling timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger handle_updated_at
  before update on public.profiles
  for each row
  execute procedure public.handle_updated_at();

create trigger handle_updated_at
  before update on public.wallets
  for each row
  execute procedure public.handle_updated_at(); 