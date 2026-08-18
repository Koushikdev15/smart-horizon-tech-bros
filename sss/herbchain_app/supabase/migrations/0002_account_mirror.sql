-- ============================================================================
-- AyurTrace+ account mirror
--
-- Run in the Supabase SQL Editor (project ref: rcsayomijvykveqvarsq).
-- Safe to re-run: every statement is idempotent.
--
-- Design notes
--   * This is a DELIBERATELY separate table from customer_profiles
--     (0001_customer_registration.sql). customer_profiles is keyed by
--     auth.users(id) and assumes Supabase Auth is the login system. The app's
--     actual login/session system is a separate MongoDB+JWT backend
--     (herbchain_backend) — that hasn't changed. This table exists only so
--     the team has a queryable copy of account-creation records in Supabase
--     for their own records/analytics, written by the backend using the
--     service-role key right after a real registration succeeds in MongoDB.
--   * No FK to auth.users — mongo_user_id is the real identity, stored as
--     plain text since it's a Mongo ObjectId, not a Supabase UUID.
--   * RLS is enabled with NO policies for anon/authenticated, so the
--     publicly-shipped keys can never read or write this table at all. Only
--     the service-role key (backend-only, never shipped to a client) can
--     touch it — service-role bypasses RLS by design.
-- ============================================================================

-- Re-declared here (idempotent) so this file doesn't hard-depend on
-- 0001_customer_registration.sql having been run first.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.account_mirror (
  id bigint generated always as identity primary key,

  -- The MongoDB _id of the real account (source of truth). Unique so a
  -- re-run/retry never creates a duplicate mirror row for the same account.
  mongo_user_id text not null unique,

  name     text not null,
  email    text not null,
  mobile   text not null,
  role     text not null,
  language text,
  region   text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists account_mirror_set_updated_at on public.account_mirror;
create trigger account_mirror_set_updated_at
  before update on public.account_mirror
  for each row execute function public.set_updated_at();

create index if not exists account_mirror_email_idx on public.account_mirror (email);

-- ─────────────────────────── Row Level Security ───────────────────────────
-- No policies are created on purpose: with RLS enabled and zero policies,
-- anon and authenticated (the two roles a client key can assume) get nothing
-- at all. Only the service-role key — held only by herbchain_backend — can
-- read or write this table, since service-role bypasses RLS entirely.
alter table public.account_mirror enable row level security;

revoke all on public.account_mirror from anon, authenticated;
