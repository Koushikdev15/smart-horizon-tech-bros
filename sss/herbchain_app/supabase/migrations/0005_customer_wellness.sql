-- ============================================================================
-- AyurTrace+ customer_wellness (re-pointed at app_login)
--
-- Run in the Supabase SQL Editor (project ref: rcsayomijvykveqvarsq).
-- Safe to re-run: every statement is idempotent.
--
-- Design notes
--   * Re-created here (0001's version was dropped along with customer_profiles
--     in 0004) pointed at public.app_login instead. This is the superset used
--     by the post-registration Health Profile screen (settings/health-profile.tsx) —
--     it has every field the 5-step registration wizard's Wellness step sends
--     PLUS the extra fields Health Profile collects (ingredient_allergies,
--     previous_adverse_reactions, pregnancy_status, dietary/ayurvedic
--     preferences, and its own consent flags), matching
--     herbchain_backend/src/models/HealthProfile.ts's field list 1:1.
--   * Wellness/health data is split into its own table because it is
--     special-category health data under a separate, revocable consent.
--     Withdrawing that consent is a single DELETE that leaves the account intact.
--   * Owner-only RLS, no anon access — same convention as app_login.
-- ============================================================================

create table if not exists public.customer_wellness (
  user_id uuid primary key references public.app_login (id) on delete cascade,

  has_allergies            text not null default 'undisclosed'
    check (has_allergies in ('no', 'yes', 'undisclosed')),
  allergies                text[] not null default '{}',
  allergy_notes            text,
  ingredient_allergies     text[] not null default '{}',

  has_current_health_issues text not null default 'undisclosed'
    check (has_current_health_issues in ('no', 'yes', 'undisclosed')),
  current_health_issues    text,

  has_existing_conditions  text not null default 'undisclosed'
    check (has_existing_conditions in ('no', 'yes', 'undisclosed')),
  conditions               text[] not null default '{}',

  medical_history_tags     text[] not null default '{}',
  medical_history          text,
  current_medication_tags  text[] not null default '{}',
  current_medications      text,
  previous_adverse_reactions text,

  pregnancy_status text not null default 'undisclosed'
    check (pregnancy_status in ('not_applicable', 'pregnant', 'breastfeeding', 'planning', 'undisclosed')),
  dietary_preferences  text[] not null default '{}',
  ayurvedic_preferences text[] not null default '{}',

  consent_store_health_data   boolean not null default false,
  consent_personalized_alerts boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists customer_wellness_set_updated_at on public.customer_wellness;
create trigger customer_wellness_set_updated_at
  before update on public.customer_wellness
  for each row execute function public.set_updated_at();

-- ─────────────────────────── Row Level Security ───────────────────────────
alter table public.customer_wellness enable row level security;

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
grant select, insert, update, delete on public.customer_wellness to authenticated;
revoke all on public.customer_wellness from anon;
