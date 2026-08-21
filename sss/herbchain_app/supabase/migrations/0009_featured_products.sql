-- ============================================================================
-- AyurTrace+ featured_products (login/home promotional & educational carousel)
--
-- Run in the Supabase SQL Editor (project ref: rcsayomijvykveqvarsq).
-- Safe to re-run: every statement is idempotent.
--
-- Design notes
--   * Publicly readable — the login-screen carousel renders before any
--     session exists, so anon must be able to select active rows. Nothing
--     sensitive belongs in this table; it's marketing/educational content.
--   * No insert/update/delete policy for anon/authenticated at all: this is
--     admin-managed content, written only with the service-role key (via a
--     one-off script or the SQL editor directly) — same "RLS enabled, zero
--     write policies" pattern as the old account_mirror table.
--   * product_id is a nullable, soft (text) reference — the product catalog
--     lives in MongoDB, out of scope here. Most rows (like the 5 AYUSH
--     awareness images for the login carousel) aren't tied to a specific
--     product at all and can leave it null.
--   * start_date/end_date are optional scheduling — a row with both null is
--     just "always active while is_active is true".
-- ============================================================================

create table if not exists public.featured_products (
  id uuid primary key default gen_random_uuid(),

  product_id text,
  image_url text not null,
  title text not null,
  short_description text,
  display_order smallint not null default 0,
  is_active boolean not null default true,
  start_date date,
  end_date date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists featured_products_set_updated_at on public.featured_products;
create trigger featured_products_set_updated_at
  before update on public.featured_products
  for each row execute function public.set_updated_at();

create index if not exists featured_products_active_order_idx
  on public.featured_products (is_active, display_order);

-- ─────────────────────────── Row Level Security ───────────────────────────
alter table public.featured_products enable row level security;

drop policy if exists featured_products_select_active on public.featured_products;
create policy featured_products_select_active
  on public.featured_products for select
  to anon, authenticated
  using (
    is_active
    and (start_date is null or current_date >= start_date)
    and (end_date is null or current_date <= end_date)
  );

-- ─────────────────────────── Data API grants ───────────────────────────
-- Read-only for both client roles; no insert/update/delete grant at all —
-- only the service-role key (bypasses RLS/grants) can write.
grant select on public.featured_products to anon, authenticated;

-- ─────────────────────────── Storage bucket ───────────────────────────
-- Public bucket: images are non-sensitive marketing/educational content
-- meant to render on the (unauthenticated) login screen, so plain public
-- URLs are appropriate — no signed-URL machinery needed.
insert into storage.buckets (id, name, public)
values ('featured-content', 'featured-content', true)
on conflict (id) do nothing;

drop policy if exists featured_content_public_read on storage.objects;
create policy featured_content_public_read
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'featured-content');
-- No insert/update/delete policy for anon/authenticated — uploads happen
-- only via the service-role key.
