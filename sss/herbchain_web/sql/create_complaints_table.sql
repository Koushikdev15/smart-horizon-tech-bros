-- ============================================================================
-- AyurTrace+ — complaints table
--
-- WHERE: Supabase Dashboard → SQL Editor → New query → paste → Run.
--
-- Unlike the analytics, audit-trail and reporting screens — all of which are
-- derived from batches and products that already exist — a complaint is
-- original data somebody files. It has no source to be computed from, so it
-- needs a home of its own.
--
-- Shape mirrors public.batches and public.products: the whole object lives in
-- `payload` (jsonb) with queryable projections generated from it.
--
-- Safe to re-run.
-- ============================================================================

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),

  payload jsonb not null,

  -- Derived, queryable projections of payload. Never written directly.
  batch_id         text generated always as (payload->>'batchId')         stored,
  complaint_type   text generated always as (payload->>'type')            stored,
  source           text generated always as (payload->>'source')          stored,
  status           text generated always as (payload->>'status')          stored,
  priority         text generated always as (payload->>'priority')        stored,
  assigned_officer text generated always as (payload->>'assignedOfficer') stored,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists complaints_status_idx     on public.complaints (status);
create index if not exists complaints_priority_idx   on public.complaints (priority);
create index if not exists complaints_batch_idx      on public.complaints (batch_id);
create index if not exists complaints_created_at_idx on public.complaints (created_at desc);

-- ── updated_at ──────────────────────────────────────────────────────────────
create or replace function public.set_complaints_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists complaints_set_updated_at on public.complaints;
create trigger complaints_set_updated_at
  before update on public.complaints
  for each row execute function public.set_complaints_updated_at();

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table public.complaints enable row level security;

-- A complaint is raised by one party and resolved by the regulator, so every
-- signed-in member can read and file, and the regulator updates. (`anon` is
-- included because the Government demo account is a client-side session with
-- no Supabase JWT and so reads as anon — the same compromise as public.batches
-- and public.products. Tighten once every role has a real Auth account.)
drop policy if exists complaints_select_members on public.complaints;
create policy complaints_select_members
  on public.complaints for select
  to anon, authenticated
  using (true);

drop policy if exists complaints_insert_members on public.complaints;
create policy complaints_insert_members
  on public.complaints for insert
  to anon, authenticated
  with check (true);

drop policy if exists complaints_update_members on public.complaints;
create policy complaints_update_members
  on public.complaints for update
  to anon, authenticated
  using (true)
  with check (true);

-- No DELETE policy — a complaint is a regulatory record. Close it by setting
-- status to 'Closed' rather than erasing it.

-- ── Data API grants ─────────────────────────────────────────────────────────
grant select, insert, update on public.complaints to authenticated, anon;

-- ── Verification ────────────────────────────────────────────────────────────
select
  (select count(*) from public.complaints) as complaint_rows,
  (select count(*) from pg_policies
    where schemaname = 'public' and tablename = 'complaints') as policies;
