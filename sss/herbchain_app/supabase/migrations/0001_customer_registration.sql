-- ============================================================================
-- AyurTrace+ customer registration
--
-- Run in the Supabase SQL Editor (project ref: rcsayomijvykveqvarsq).
-- Safe to re-run: every statement is idempotent.
--
-- Design notes
--   * Both tables are keyed by auth.users(id). Identity comes from the verified
--     JWT, never from a client-supplied column, so a caller cannot write a row
--     on someone else's behalf.
--   * The mobile app ships the anon key publicly, so RLS is the only thing
--     standing between these rows and the internet. Every table below is
--     owner-only, with no anon read path at all.
--   * Government ID numbers are stored as LAST FOUR DIGITS ONLY. Full Aadhaar
--     numbers are deliberately not persisted here — see the note on
--     customer_profiles.aadhaar_last4.
--   * Wellness data is split into its own table because it is special-category
--     health data under a separate, revocable consent. Withdrawing that consent
--     is a single DELETE that leaves the account intact.
-- ============================================================================

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

-- ─────────────────────────── customer_profiles ───────────────────────────
create table if not exists public.customer_profiles (
  id uuid primary key references auth.users (id) on delete cascade,

  -- Account
  full_name    text not null check (length(btrim(full_name)) between 2 and 120),
  email        text not null check (position('@' in email) > 1),
  phone        text not null check (phone ~ '^[6-9][0-9]{9}$'),
  language     text not null default 'en' check (language in ('en', 'ta')),

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
  consent_terms              boolean not null default false,
  consent_privacy            boolean not null default false,
  consent_store_health_data  boolean not null default false,
  consent_personalized_alerts boolean not null default false,
  consent_accepted_at        timestamptz,

  profile_completion smallint not null default 0
    check (profile_completion between 0 and 100),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists customer_profiles_set_updated_at on public.customer_profiles;
create trigger customer_profiles_set_updated_at
  before update on public.customer_profiles
  for each row execute function public.set_updated_at();

-- ─────────────────────────── customer_wellness ───────────────────────────
create table if not exists public.customer_wellness (
  user_id uuid primary key references public.customer_profiles (id) on delete cascade,

  has_allergies          text not null default 'undisclosed'
    check (has_allergies in ('no', 'yes', 'undisclosed')),
  allergies              text[] not null default '{}',
  allergy_notes          text,

  has_current_issues     text not null default 'undisclosed'
    check (has_current_issues in ('no', 'yes', 'undisclosed')),
  current_health_issues  text,

  has_existing_conditions text not null default 'undisclosed'
    check (has_existing_conditions in ('no', 'yes', 'undisclosed')),
  conditions             text[] not null default '{}',

  medical_history        text,
  current_medications    text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists customer_wellness_set_updated_at on public.customer_wellness;
create trigger customer_wellness_set_updated_at
  before update on public.customer_wellness
  for each row execute function public.set_updated_at();

-- ─────────────────────────── Indexes ───────────────────────────
-- Both tables are keyed by the same column the RLS predicate filters on, so the
-- primary key already serves the policy lookup. This one supports the
-- "is this phone already registered" check.
create unique index if not exists customer_profiles_phone_key
  on public.customer_profiles (phone);

-- ─────────────────────────── Row Level Security ───────────────────────────
alter table public.customer_profiles enable row level security;
alter table public.customer_wellness enable row level security;

-- customer_profiles: a signed-in user may only ever see and edit their own row.
-- auth.uid() is wrapped in a subselect so it is evaluated once per statement
-- rather than once per row.
drop policy if exists customer_profiles_select_own on public.customer_profiles;
create policy customer_profiles_select_own
  on public.customer_profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists customer_profiles_insert_own on public.customer_profiles;
create policy customer_profiles_insert_own
  on public.customer_profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

-- USING and WITH CHECK are both required: without WITH CHECK a user could
-- rewrite id and hand their row to another account.
drop policy if exists customer_profiles_update_own on public.customer_profiles;
create policy customer_profiles_update_own
  on public.customer_profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists customer_profiles_delete_own on public.customer_profiles;
create policy customer_profiles_delete_own
  on public.customer_profiles for delete
  to authenticated
  using ((select auth.uid()) = id);

-- customer_wellness: same ownership rule. DELETE is granted so a user can
-- withdraw health-data consent and erase the record themselves.
drop policy if exists customer_wellness_select_own on public.customer_wellness;
create policy customer_wellness_select_own
  on public.customer_wellness for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists customer_wellness_insert_own on public.customer_wellness;
create policy customer_wellness_insert_own
  on public.customer_wellness for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists customer_wellness_update_own on public.customer_wellness;
create policy customer_wellness_update_own
  on public.customer_wellness for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists customer_wellness_delete_own on public.customer_wellness;
create policy customer_wellness_delete_own
  on public.customer_wellness for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ─────────────────────────── Data API grants ───────────────────────────
-- Newly created tables are not always exposed to the REST API automatically.
-- Grant the authenticated role only; anon gets nothing, so an extracted anon
-- key cannot read a single row.
grant select, insert, update, delete on public.customer_profiles to authenticated;
grant select, insert, update, delete on public.customer_wellness to authenticated;

revoke all on public.customer_profiles from anon;
revoke all on public.customer_wellness from anon;
