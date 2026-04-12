-- Waitlist table for early access email collection
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now(),
  constraint waitlist_email_unique unique (email)
);

-- Enable RLS
alter table public.waitlist enable row level security;

-- Allow anonymous inserts (landing page visitors aren't authenticated)
create policy "Anyone can join the waitlist"
  on public.waitlist
  for insert
  to anon
  with check (true);

-- Only authenticated admins can read the waitlist
create policy "Admins can read waitlist"
  on public.waitlist
  for select
  to authenticated
  using (true);
