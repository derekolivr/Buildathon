-- Enable required extension for gen_random_uuid()
create extension if not exists pgcrypto;

-- Clients
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  address text,
  organization text,
  created_at timestamp with time zone default now()
);

-- Documents
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  file_name text not null,
  storage_url text,
  extracted_fields jsonb default '{}'::jsonb,
  autofilled_url text,
  created_at timestamp with time zone default now()
);

-- Messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  channel text not null,
  body text not null,
  status text default 'queued',
  scheduled_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Activities (audit log)
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  message text not null,
  client_id uuid references public.clients(id) on delete set null,
  document_id uuid references public.documents(id) on delete set null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- Basic RLS setup
alter table if exists public.clients enable row level security;
alter table if exists public.activities enable row level security;

-- Use drop+create for compatibility with Postgres versions lacking IF NOT EXISTS
drop policy if exists "clients_select_own" on public.clients;
create policy "clients_select_own" on public.clients
for select
using (auth.uid() = user_id);

drop policy if exists "clients_insert_own" on public.clients;
create policy "clients_insert_own" on public.clients
for insert
with check (auth.uid() = user_id);

drop policy if exists "clients_update_own" on public.clients;
create policy "clients_update_own" on public.clients
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "clients_delete_own" on public.clients;
create policy "clients_delete_own" on public.clients
for delete
using (auth.uid() = user_id);

drop policy if exists "activities_select_own" on public.activities;
create policy "activities_select_own" on public.activities
for select
using (auth.uid() = user_id);

drop policy if exists "activities_insert_own" on public.activities;
create policy "activities_insert_own" on public.activities
for insert
with check (auth.uid() = user_id);


-- If you just created tables, reload PostgREST schema cache
-- select pg_notify('pgrst', 'reload schema');
