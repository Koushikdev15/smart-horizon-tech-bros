-- ============================================================================
-- AyurTrace+ app_login (replaces the dormant customer_profiles design)
--
-- Run in the Supabase SQL Editor (project ref: rcsayomijvykveqvarsq).
-- Safe to re-run: every statement is idempotent.
--
-- Design notes
--   * This table replaces both customer_profiles (0001_customer_registration.sql,
--     never wired up to real traffic) and account_mirror (0002/0003 — write-only
--     Mongo copy, now dropped). Supabase Auth (auth.users) is now the ONE
--     source of truth for the mobile customer app's login; this table holds
--     the app-owned profile row for each account, one-to-one with auth.users.
--   * customer_profiles is dropped first (cascades to customer_wellness, which
--     0005 recreates against this table) rather than renamed in place: it was
--     never wired to real registration traffic (herbchain_backend/Mongo was),
--     so there is no live data to preserve.
--   * Keyed by auth.users(id). Identity comes from the verified JWT, never
--     from a client-supplied column, so a caller cannot write a row on
--     someone else's behalf.
--   * Every account gets a unique, DB-generated ayurvedic_id (AYUR-CUST-xxxxxx)
--     on insert — generation happens server-side with a collision-retry loop,
--     so uniqueness is guaranteed atomically instead of relying on the client
--     to avoid collisions (see herbchain_web's client-side
--     `generateAyurvedicId`, which has no such guarantee).
--   * Owner-only RLS, no anon access at all — same convention as the table it
--     replaces, deliberately NOT the wide-open `using (true)` convention
--     herbchain_web's `members` table uses.
-- ============================================================================

-- Drop the old, never-activated design. Cascades to customer_wellness, which
-- 0005 recreates pointed at app_login.
drop table if exists public.customer_profiles cascade;

-- ─────────────────────────── updated_at helper ───────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────── Ayurvedic ID generator ───────────────────────
create or replace function public.generate_ayurvedic_id()
returns text
language plpgsql
as $$
declare
  candidate text;
  attempt   int := 0;
begin
  loop
    candidate := 'AYUR-CUST-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
    attempt := attempt + 1;
    exit when not exists (
      select 1 from public.app_login where ayurvedic_id = candidate
    );
    if attempt > 20 then
      raise exception 'generate_ayurvedic_id: could not find a unique id after % attempts', attempt;
    end if;
  end loop;
  return candidate;
end;
$$;

create or replace function public.app_login_set_ayurvedic_id()
returns trigger
language plpgsql
as $$
begin
  if new.ayurvedic_id is null then
    new.ayurvedic_id := public.generate_ayurvedic_id();
  end if;
  return new;
end;
$$;

-- ─────────────────────────── app_login ───────────────────────────
create table if not exists public.app_login (
  id uuid primary key references auth.users (id) on delete cascade,

  ayurvedic_id text not null unique,

  -- Account
  full_name    text not null check (length(btrim(full_name)) between 2 and 120),
  email        text not null check (position('@' in email) > 1),
  phone        text not null check (phone ~ '^[6-9][0-9]{9}$'),
  language     text not null default 'en' check (language in ('en', 'ta')),
  role         text not null default 'Customer',

  -- Identity.
  -- Only the last four digits of Aadhaar/PAN are retained. Storing full Aadhaar
  -- numbers carries obligations under the Aadhaar Act that a public-anon-key
  -- mobile client cannot satisfy; if full-number KYC is ever required, it must
  -- run server-side and must not land in a Data-API-exposed table.
  date_of_birth  date check (date_of_birth <= current_date - interval '18 years'),
  aadhaar_last4  text check (aadhaar_last4 ~ '^[0-9]{4}$'),
  pan_last4      text check (pan_last4 ~ '^[A-Z0-9]{4}$'),
  occupation     text,
  religion       text,

  -- Location
  region     text,
  address    text,
  latitude   double precision check (latitude between -90 and 90),
  longitude  double precision check (longitude between -180 and 180),

  -- Consent. Terms + privacy are required to hold an account; the other two are
  -- independently revocable and default to false.
  consent_terms                boolean not null default false,
  consent_privacy              boolean not null default false,
  consent_store_health_data    boolean not null default false,
  consent_personalized_alerts  boolean not null default false,
  consent_accepted_at          timestamptz,

  profile_completion smallint not null default 0
    check (profile_completion between 0 and 100),

  last_login_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists app_login_set_ayurvedic_id on public.app_login;
create trigger app_login_set_ayurvedic_id
  before insert on public.app_login
  for each row execute function public.app_login_set_ayurvedic_id();

drop trigger if exists app_login_set_updated_at on public.app_login;
create trigger app_login_set_updated_at
  before update on public.app_login
  for each row execute function public.set_updated_at();

-- ─────────────────────────── Indexes ───────────────────────────
create unique index if not exists app_login_phone_key on public.app_login (phone);
-- ayurvedic_id already has a unique constraint (and its supporting index) from
-- the column definition above; this is just for lookups that don't hit the PK.
create index if not exists app_login_email_idx on public.app_login (email);

-- ─────────────────────────── Row Level Security ───────────────────────────
alter table public.app_login enable row level security;

drop policy if exists app_login_select_own on public.app_login;
create policy app_login_select_own
  on public.app_login for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists app_login_insert_own on public.app_login;
create policy app_login_insert_own
  on public.app_login for insert
  to authenticated
  with check ((select auth.uid()) = id);

-- USING and WITH CHECK are both required: without WITH CHECK a user could
-- rewrite id and hand their row to another account.
drop policy if exists app_login_update_own on public.app_login;
create policy app_login_update_own
  on public.app_login for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists app_login_delete_own on public.app_login;
create policy app_login_delete_own
  on public.app_login for delete
  to authenticated
  using ((select auth.uid()) = id);

-- ─────────────────────────── Data API grants ───────────────────────────
-- Newly created tables are not always exposed to the REST API automatically.
-- Grant the authenticated role only; anon gets nothing, so an extracted anon
-- key cannot read a single row.
grant select, insert, update, delete on public.app_login to authenticated;
revoke all on public.app_login from anon;
