-- Run in the Supabase SQL Editor for project rcsayomijvykveqvarsq.
-- Creates the `members` table used by Member Registration + Active Members
-- in the Admin Portal. Safe to re-run.

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  "ayurvedicId" text not null unique,
  name text not null,
  "organizationName" text,
  role text not null,
  email text not null,
  phone text,
  region text,
  address text,
  gst text,
  pan text,
  "licenseNumber" text,
  status text not null default 'Pending'
    check (status in ('Active', 'Pending', 'Suspended', 'Disabled', 'Rejected')),
  "registeredDate" timestamptz not null default now(),
  "warehouseCapacity" text,
  "vehicleDetails" text,
  "nablCertificate" text,
  "drugLicense" text,
  "gmpCertificate" text,
  "manufacturingLicense" text,
  "farmerDetails" jsonb,
  "wildCollectorDetails" jsonb,
  created_at timestamptz not null default now()
);

create index if not exists members_email_idx on public.members (email);
create index if not exists members_status_idx on public.members (status);

-- RLS: the Admin Portal currently talks to Supabase with the public anon key
-- and no real Supabase Auth session (its own login screen is separate from
-- Supabase Auth), so policies are scoped to the anon role. This keeps the
-- registration + active-members flow working today; if/when the Admin
-- Portal login is wired to real Supabase Auth, tighten these to `authenticated`
-- and drop anon access.
alter table public.members enable row level security;

drop policy if exists "members_insert_anon" on public.members;
create policy "members_insert_anon"
on public.members for insert to anon, authenticated
with check (true);

drop policy if exists "members_select_anon" on public.members;
create policy "members_select_anon"
on public.members for select to anon, authenticated
using (true);

drop policy if exists "members_update_anon" on public.members;
create policy "members_update_anon"
on public.members for update to anon, authenticated
using (true)
with check (true);
