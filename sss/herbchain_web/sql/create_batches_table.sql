-- ============================================================================
-- AyurTrace+ — batches table
--
-- WHERE: Supabase Dashboard → SQL Editor → New query → paste → Run.
--
-- Batches were previously held only in an in-memory Zustand store, so every
-- batch vanished on page reload and was never visible to any other login. This
-- gives them a real home.
--
-- Shape: the full Batch object lives in `payload` (jsonb), and the fields worth
-- filtering on are *generated* from it. That keeps a single source of truth —
-- there is no way for a column and the JSON to drift — while still allowing
-- indexed queries. It also means the ~30 sparse, stage-specific fields
-- (lab results, packaging, dispatch…) need no schema change as they evolve.
--
-- Safe to re-run.
-- ============================================================================

create table if not exists public.batches (
  id uuid primary key default gen_random_uuid(),

  -- The complete Batch object as the app models it.
  payload jsonb not null,

  -- Derived, queryable projections of payload. Never written directly.
  batch_number      text generated always as (payload->>'batchNumber')      stored,
  species           text generated always as (payload->>'species')          stored,
  status            text generated always as (payload->>'status')           stored,
  collection_center text generated always as (payload->>'collectionCenter') stored,
  collector_name    text generated always as (payload->>'collectorName')    stored,
  region            text generated always as (payload->>'region')           stored,
  harvest_date      text generated always as (payload->>'harvestDate')      stored,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per batch number.
create unique index if not exists batches_batch_number_key
  on public.batches (batch_number);

-- Collection Centre history and the role dashboards filter on these.
create index if not exists batches_collection_center_idx on public.batches (collection_center);
create index if not exists batches_status_idx            on public.batches (status);
create index if not exists batches_created_at_idx        on public.batches (created_at desc);

-- ── updated_at ──────────────────────────────────────────────────────────────
create or replace function public.set_batches_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists batches_set_updated_at on public.batches;
create trigger batches_set_updated_at
  before update on public.batches
  for each row execute function public.set_batches_updated_at();

-- ── Row Level Security ──────────────────────────────────────────────────────
-- A batch is a shared supply-chain record: every stage (Collection, Processing,
-- Manufacturing, Supply Chain, Government) must read it and advance its status.
-- So access is granted to any signed-in member rather than scoped per row.
--
-- DELETE is intentionally omitted — batches form an audit trail and should be
-- rejected via status, never erased.
alter table public.batches enable row level security;

drop policy if exists batches_select_authenticated on public.batches;
create policy batches_select_authenticated
  on public.batches for select
  to authenticated
  using (true);

drop policy if exists batches_insert_authenticated on public.batches;
create policy batches_insert_authenticated
  on public.batches for insert
  to authenticated
  with check (true);

drop policy if exists batches_update_authenticated on public.batches;
create policy batches_update_authenticated
  on public.batches for update
  to authenticated
  using (true)
  with check (true);

-- The portal currently signs members in through Supabase Auth, but the
-- Government demo account is a client-side session with no Supabase JWT — it
-- therefore reads as `anon`. Grant anon the same read/write access so the demo
-- admin isn't locked out. Tighten this once every role has a real Auth account.
drop policy if exists batches_select_anon on public.batches;
create policy batches_select_anon
  on public.batches for select
  to anon
  using (true);

drop policy if exists batches_insert_anon on public.batches;
create policy batches_insert_anon
  on public.batches for insert
  to anon
  with check (true);

drop policy if exists batches_update_anon on public.batches;
create policy batches_update_anon
  on public.batches for update
  to anon
  using (true)
  with check (true);

-- ── Data API grants ─────────────────────────────────────────────────────────
grant select, insert, update on public.batches to authenticated, anon;

-- ── Verification ────────────────────────────────────────────────────────────
select
  (select count(*) from public.batches) as batch_rows,
  (select count(*) from pg_policies
    where schemaname = 'public' and tablename = 'batches') as policies;
