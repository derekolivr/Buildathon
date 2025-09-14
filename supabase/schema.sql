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
  extracted_fields jsonb default {}::jsonb,
  autofilled_url text,
  created_at timestamp with time zone default now()
);

-- Messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  channel text not null,
  body text not null,
  status text default queued,
  scheduled_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Basic RLS setup (optional, enable if using RLS)
-- alter table public.clients enable row level security;
-- alter table public.documents enable row level security;
-- alter table public.messages enable row level security;

-- Example policies (adjust as needed)
-- create policy "clients_access" on public.clients for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- create policy "documents_access" on public.documents for all using (exists(select 1 from public.clients c where c.id = client_id and c.user_id = auth.uid())) with check (exists(select 1 from public.clients c where c.id = client_id and c.user_id = auth.uid()));
-- create policy "messages_access" on public.messages for all using (exists(select 1 from public.clients c where c.id = client_id and c.user_id = auth.uid())) with check (exists(select 1 from public.clients c where c.id = client_id and c.user_id = auth.uid()));
