-- ============================================================================
-- ayurvedic_doctors — reference directory of government-gazette-verified
-- Ayurveda doctors, powering the customer app's Doctor Portal.
--
-- Run in the Supabase SQL Editor (project ref: rcsayomijvykveqvarsq).
-- Safe to re-run: every statement is idempotent.
--
-- Design notes
--   * Publicly readable — the Doctor Portal loads for any signed-in customer,
--     no sensitive data here (all sourced from an official public gazette).
--   * No insert/update/delete policy for anon/authenticated: admin-managed
--     content, written only via the service-role key (one-off import
--     script) — same "RLS enabled, zero write policies" pattern already
--     used by featured_products / app_login.
--   * district is the only "location" signal available (the source CSV has
--     no coordinates) — indexed since the app queries it by equality/ILIKE
--     to approximate "doctors near me".
-- ============================================================================

create table if not exists public.ayurvedic_doctors (
  id uuid primary key default gen_random_uuid(),

  registration_no text,
  doctor_name text not null,
  district text not null,
  qualification text,
  registration_date date,
  registered_address text,
  clinic_hospital_name text,
  verification_source text,
  verification_status text,
  source_url text,

  created_at timestamptz not null default now()
);

create index if not exists ayurvedic_doctors_district_idx
  on public.ayurvedic_doctors (district);

-- ─────────────────────────── Row Level Security ───────────────────────────
alter table public.ayurvedic_doctors enable row level security;

drop policy if exists ayurvedic_doctors_select_all on public.ayurvedic_doctors;
create policy ayurvedic_doctors_select_all
  on public.ayurvedic_doctors for select
  to anon, authenticated
  using (true);

-- ─────────────────────────── Data API grants ───────────────────────────
grant select on public.ayurvedic_doctors to anon, authenticated;
