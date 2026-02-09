-- Trailguide Pro Editor Database Schema
-- Run this in your Supabase SQL editor to set up the required tables

-- Enable RLS
alter database postgres set "app.jwt_secret" to 'your-jwt-secret';

-- Profiles (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  github_username text,
  github_access_token text,  -- Consider encrypting this in production
  created_at timestamptz default now() not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Connected repositories
create table if not exists public.repos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade not null,
  github_repo_id bigint not null,
  repo_name text not null,
  repo_owner text not null,
  installation_id bigint,
  created_at timestamptz default now() not null,
  unique(user_id, github_repo_id)
);

-- Enable RLS on repos
alter table public.repos enable row level security;

-- Repos policies
create policy "Users can view own repos"
  on public.repos for select
  using (auth.uid() = user_id);

create policy "Users can manage own repos"
  on public.repos for all
  using (auth.uid() = user_id);

-- Cached trails (for faster loads)
create table if not exists public.trails (
  id uuid primary key default gen_random_uuid(),
  repo_id uuid references public.repos on delete cascade not null,
  path text not null,
  content jsonb not null,
  sha text,  -- GitHub blob SHA for cache invalidation
  updated_at timestamptz default now() not null,
  unique(repo_id, path)
);

-- Enable RLS on trails
alter table public.trails enable row level security;

-- Trails policies
create policy "Users can view own trails"
  on public.trails for select
  using (
    exists (
      select 1 from public.repos
      where repos.id = trails.repo_id
      and repos.user_id = auth.uid()
    )
  );

create policy "Users can manage own trails"
  on public.trails for all
  using (
    exists (
      select 1 from public.repos
      where repos.id = trails.repo_id
      and repos.user_id = auth.uid()
    )
  );

-- Subscriptions (Stripe billing + trials)
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade not null unique,
  stripe_customer_id text,  -- NULL during trial (no credit card yet)
  stripe_subscription_id text,  -- NULL during trial
  status text not null,  -- trialing, active, cancelled, past_due, expired
  current_period_end timestamptz not null,  -- Trial end date or billing period end
  created_at timestamptz default now() not null
);

-- Allow service role to insert subscriptions (for trial creation)
create policy "Service role can manage subscriptions"
  on public.subscriptions for all
  using (true)
  with check (true);

-- Enable RLS on subscriptions
alter table public.subscriptions enable row level security;

-- Subscriptions policies
create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Analytics events
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  trail_id text not null,
  user_id uuid references public.profiles not null,  -- Trail owner
  event_type text not null,
  step_id text,
  step_index int,
  session_id text not null,
  created_at timestamptz default now() not null
);

-- Indexes for analytics queries
create index if not exists idx_analytics_trail
  on public.analytics_events(trail_id, created_at);

create index if not exists idx_analytics_user
  on public.analytics_events(user_id, created_at);

create index if not exists idx_analytics_session
  on public.analytics_events(session_id);

-- Enable RLS on analytics_events
alter table public.analytics_events enable row level security;

-- Analytics policies
create policy "Users can view own trail analytics"
  on public.analytics_events for select
  using (auth.uid() = user_id);

-- Note: INSERT policy is more permissive for the analytics endpoint
-- The API validates ownership separately
create policy "Allow analytics inserts"
  on public.analytics_events for insert
  with check (true);

-- Function to automatically create profile and trial on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Create profile
  insert into public.profiles (id, github_username)
  values (
    new.id,
    new.raw_user_meta_data->>'user_name'
  );

  -- Create 14-day trial subscription (no credit card required)
  insert into public.subscriptions (user_id, status, current_period_end)
  values (
    new.id,
    'trialing',
    now() + interval '14 days'
  );

  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
