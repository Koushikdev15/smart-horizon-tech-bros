-- ============================================================================
-- AyurTrace+ — products table
--
-- WHERE: Supabase Dashboard → SQL Editor → New query → paste → Run.
--
-- A product is the finished consumer good formulated from one or more
-- checked-in batches. The QR printed on the pack resolves to
-- /verify/{product_code}, which is served to the PUBLIC — anyone holding the
-- box, with no login — so this table needs an anonymous read path.
--
-- Shape mirrors public.batches: the whole Product object lives in `payload`
-- (jsonb) with queryable projections generated from it, so the many sparse
-- label/QC fields need no schema change as they evolve.
--
-- Safe to re-run.
-- ============================================================================

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),

  -- The complete Product object as the app models it.
  payload jsonb not null,

  -- Derived, queryable projections of payload. Never written directly.
  product_code      text generated always as (payload->>'productCode')       stored,
  product_name      text generated always as (payload->>'productName')       stored,
  category          text generated always as (payload->>'category')          stored,
  manufacturer_name text generated always as (payload->>'manufacturerName')  stored,
  status            text generated always as (payload->>'status')            stored,
  manufacturing_date text generated always as (payload->>'manufacturingDate') stored,
  expiry_date       text generated always as (payload->>'expiryDate')        stored,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The product code is what the QR encodes, so it must resolve to exactly one row.
create unique index if not exists products_product_code_key
  on public.products (product_code);

create index if not exists products_manufacturer_idx on public.products (manufacturer_name);
create index if not exists products_status_idx       on public.products (status);
create index if not exists products_created_at_idx   on public.products (created_at desc);

-- Lets "which products used this batch?" be answered without a table scan.
create index if not exists products_components_idx
  on public.products using gin ((payload -> 'components'));

-- ── updated_at ──────────────────────────────────────────────────────────────
create or replace function public.set_products_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_products_updated_at();

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table public.products enable row level security;

-- PUBLIC READ, deliberately.
--
-- The whole point of the printed QR is that a consumer can scan it without an
-- account. A product row therefore carries only what belongs on a pack insert:
-- the herb, its origin region, the collection centre, the certificate number
-- and the timeline. Do NOT add personal contact details, bank details or
-- document scans to this payload — anything written here is world-readable.
drop policy if exists products_select_public on public.products;
create policy products_select_public
  on public.products for select
  to anon, authenticated
  using (true);

-- Writes stay with signed-in members. (`anon` is included because the
-- Government demo account is a client-side session with no Supabase JWT and so
-- reads as anon — same compromise as public.batches. Tighten once every role
-- has a real Auth account.)
drop policy if exists products_insert_members on public.products;
create policy products_insert_members
  on public.products for insert
  to anon, authenticated
  with check (true);

drop policy if exists products_update_members on public.products;
create policy products_update_members
  on public.products for update
  to anon, authenticated
  using (true)
  with check (true);

-- No DELETE policy — a released product is an audit record. Withdraw it by
-- setting status to 'Recalled' rather than erasing it.

-- ── Data API grants ─────────────────────────────────────────────────────────
grant select, insert, update on public.products to authenticated, anon;

-- ── Verification ────────────────────────────────────────────────────────────
select
  (select count(*) from public.products) as product_rows,
  (select count(*) from pg_policies
    where schemaname = 'public' and tablename = 'products') as policies;
