## Microentrepreneur Dashboard

All‑in‑one dashboard for managing clients, documents, and AI‑assisted automation.

### Features

- Authenticated dashboard (Supabase Auth)
- Clients CRUD (PostgREST over `public.clients`)
- Documents management (upload to Supabase Storage bucket `documents`)
- AI Ingest: upload a file, call an external OCR/LLM service, extract client info, upsert client, and save document
- Middleware‑protected routes for `/dashboard`
- Recent Activity (audit log of uploads/ingests/client edits)
- Inline client actions (Edit/Delete) from the three‑dots menu

### Tech

- Next.js 15 (App Router), React 19
- TypeScript, ESLint
- Supabase: `@supabase/ssr` server client for auth/session & DB

---

## Quickstart

1. Install

```bash
npm install
```

2. Environment

Create `.env` (or `.env.local`) in project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Optional: external OCR/LLM service used by /api/ingest
# If set, the API forwards uploaded files as multipart/form-data with field "file"
DOCUMENT_EXTRACT_URL=https://your-endpoint.example.com/extract
# Optional bearer for your extractor; leave empty to disable
DOCUMENT_EXTRACT_BEARER=

# Optional: external PDF form filler used by /api/autofill
# POST { file: <pdf> } → returns a filled PDF (application/pdf)
DOCUMENT_FILL_URL=https://your-endpoint.example.com/fill
# Optional bearer for your filler; leave empty to disable
DOCUMENT_FILL_BEARER=
```

3. Database schema (run in Supabase SQL editor for the SAME project as your env)

```sql
create extension if not exists pgcrypto;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  address text,
  organization text,
  created_at timestamptz default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  file_name text not null,
  storage_url text,
  extracted_fields jsonb default '{}'::jsonb,
  autofilled_url text,
  created_at timestamptz default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  channel text not null,
  body text not null,
  status text default 'queued',
  scheduled_at timestamptz,
  created_at timestamptz default now()
);

-- Activities (audit log)
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,                    -- e.g. document.uploaded, client.updated
  message text not null,
  client_id uuid references public.clients(id) on delete set null,
  document_id uuid references public.documents(id) on delete set null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.clients enable row level security;
alter table public.activities enable row level security;

drop policy if exists "clients_select_own" on public.clients;
create policy "clients_select_own" on public.clients for select using (auth.uid() = user_id);

drop policy if exists "clients_insert_own" on public.clients;
create policy "clients_insert_own" on public.clients for insert with check (auth.uid() = user_id);

drop policy if exists "clients_update_own" on public.clients;
create policy "clients_update_own" on public.clients for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "clients_delete_own" on public.clients;
create policy "clients_delete_own" on public.clients for delete using (auth.uid() = user_id);

-- Activity policies
create policy if not exists "activities_select_own" on public.activities
for select using (auth.uid() = user_id);

create policy if not exists "activities_insert_own" on public.activities
for insert with check (auth.uid() = user_id);

-- Storage bucket for uploads (private is fine)
insert into storage.buckets (id, name, public)
values ('documents','documents', false)
on conflict (id) do nothing;

-- Reload PostgREST schema cache
select pg_notify('pgrst', 'reload schema');
```

4. Run

```bash
npm run dev
# or production
rm -rf .next && npm run build && npm start
```

---

## App Flow

### Clients

- Create/edit/delete clients
- API: `GET/POST/PUT/DELETE /api/clients`

### Documents

- When opened with `?clientId=<id>`: page shows stats and list for that client
  - Upload Document: attaches file to that client (no extraction)
  - Ingest Document: calls external extractor to auto‑detect client; if different, redirects to that client (logged in Recent Activity)
- When opened without `clientId`: shows only Ingest; on success, redirects to the detected/created client

### Ingestion Service Contract

`/api/ingest` expects your external service to accept:

- Method: `POST`
- Content‑Type: `multipart/form-data`
- Field name: `file`
- Response JSON (flat keys preferred):

```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "555-0100",
  "organization": "Acme",
  "address": "123 Main St",
  "extras": { "any": "other fields (optional)" }
}
```

If `DOCUMENT_EXTRACT_URL` is not set, the API uses mock fields to keep the demo running.

---

## API Summary

- `GET /api/auth/check` → session status
- `POST /auth/signout` → sign out and redirect
- `GET /api/clients?id=...` → fetch by id; without id, list for current user
- `POST /api/clients` → create client `{ name, phone?, email?, address?, organization? }`
- `PUT /api/clients` → update client `{ id, ...updates }`
- `DELETE /api/clients?id=...` → delete
- `GET /api/documents?client_id=...` → list client documents
- `POST /api/documents` → upload file (multipart) `{ file, client_id }`
- `POST /api/autofill` → document autofill; if `DOCUMENT_FILL_URL` set, forwards file to filler
  - Accepts filler responses:
    - application/pdf → stored to Storage; `autofilled_url` updated
    - application/json → may include any of:
      - `pdf_base64` or `pdf` (base64 string) → stored; `autofilled_url` updated
      - `pdf_url` (direct URL) → fetched and stored; `autofilled_url` updated
      - `extracted_fields` (object) or `fields` (object) or `matched_fields` (array of `{ pdf_field, value }`) → merged into `extracted_fields`
- `POST /api/ingest` → forward file to `DOCUMENT_EXTRACT_URL`, upsert client, save document
- `GET /api/activity` → latest activity rows for current user

---

## Troubleshooting

**Failed to parse cookie string / base64 JSON**

- Fixed by using `@supabase/ssr` everywhere (middleware and route handlers)

**Invalid API key**

- Happens if `SUPABASE_SERVICE_ROLE_KEY` is a placeholder; remove it or set the real one. The app ignores obviously invalid placeholders.

**Could not find the table 'public.clients'**

- Create tables in the same Supabase project your env points to and run:

```sql
select pg_notify('pgrst', 'reload schema');
```

**Extractor always returns mock data**

- Your external endpoint must return HTTP 200 with JSON matching the contract above; otherwise `/api/ingest` falls back to mock.

**DialogTrigger error when opening dialogs**

- Use controlled dialogs (set `open` state) or ensure `DialogTrigger` is nested inside the same `Dialog`. The app uses controlled dialogs for reliability.

**Missing avatar.png 404**

- Either add `public/avatar.png` or rely on initials fallback by removing the `AvatarImage` usage in `src/components/dashboard/header.tsx`.

---

## Notes

- Keep secrets on the server (never expose service role keys or third‑party API keys to the browser)
- The ingestion pipeline is modular; you can swap in Cloudflare Worker, Colab + cloudflared, or any HTTPS service

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
