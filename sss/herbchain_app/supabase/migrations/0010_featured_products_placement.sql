-- ============================================================================
-- featured_products: add `placement` so the same table can hold separate
-- carousel content for the login screen and the home screen.
--
-- Run in the Supabase SQL Editor (project ref: rcsayomijvykveqvarsq).
-- Safe to re-run: every statement is idempotent.
-- ============================================================================

alter table public.featured_products
  add column if not exists placement text not null default 'login';

alter table public.featured_products
  drop constraint if exists featured_products_placement_check;
alter table public.featured_products
  add constraint featured_products_placement_check
  check (placement in ('login', 'home'));

-- Existing 5 rows (the AYUSH login banners) already default to 'login' — no
-- backfill needed.

drop index if exists featured_products_active_order_idx;
create index if not exists featured_products_placement_active_order_idx
  on public.featured_products (placement, is_active, display_order);
