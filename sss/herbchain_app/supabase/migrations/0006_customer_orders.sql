-- ============================================================================
-- AyurTrace+ customer_orders / customer_order_items
--
-- Run in the Supabase SQL Editor (project ref: rcsayomijvykveqvarsq).
-- Safe to re-run: every statement is idempotent.
--
-- Design notes
--   * Field list mirrors herbchain_backend/src/models/Order.ts 1:1. Orders are
--     still created by herbchain_backend (it owns the product/store catalog,
--     which stays in MongoDB — out of scope for this migration), using the
--     service-role key, which bypasses RLS. The owner-only policies below
--     exist so the app can also read a user's own order history directly.
--   * product_id / store_id are plain text, not foreign keys: the catalogs
--     they point at (Product, Store) live in MongoDB, not this database, so
--     these are necessarily soft cross-database references.
-- ============================================================================

create table if not exists public.customer_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_login (id) on delete cascade,

  total_amount     numeric(12, 2) not null check (total_amount >= 0),
  delivery_address text not null,
  region           text not null,

  payment_method text not null check (payment_method in ('COD', 'ONLINE')),
  payment_status text not null default 'PENDING'
    check (payment_status in ('COD', 'PENDING', 'PAID', 'FAILED')),
  order_status   text not null default 'PLACED'
    check (order_status in ('PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.customer_orders (id) on delete cascade,

  product_id   text not null,
  product_name text not null,
  store_id     text not null,
  store_name   text not null,
  quantity     integer not null check (quantity >= 1),
  unit_price   numeric(12, 2) not null check (unit_price >= 0)
);

drop trigger if exists customer_orders_set_updated_at on public.customer_orders;
create trigger customer_orders_set_updated_at
  before update on public.customer_orders
  for each row execute function public.set_updated_at();

create index if not exists customer_orders_user_id_idx on public.customer_orders (user_id);
create index if not exists customer_order_items_order_id_idx on public.customer_order_items (order_id);

-- ─────────────────────────── Row Level Security ───────────────────────────
alter table public.customer_orders enable row level security;
alter table public.customer_order_items enable row level security;

drop policy if exists customer_orders_select_own on public.customer_orders;
create policy customer_orders_select_own
  on public.customer_orders for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists customer_orders_insert_own on public.customer_orders;
create policy customer_orders_insert_own
  on public.customer_orders for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists customer_orders_update_own on public.customer_orders;
create policy customer_orders_update_own
  on public.customer_orders for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- customer_order_items has no user_id of its own — ownership is via its
-- parent order, checked through a subquery against customer_orders (which is
-- itself owner-scoped above).
drop policy if exists customer_order_items_select_own on public.customer_order_items;
create policy customer_order_items_select_own
  on public.customer_order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.customer_orders o
      where o.id = customer_order_items.order_id
        and o.user_id = (select auth.uid())
    )
  );

drop policy if exists customer_order_items_insert_own on public.customer_order_items;
create policy customer_order_items_insert_own
  on public.customer_order_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.customer_orders o
      where o.id = customer_order_items.order_id
        and o.user_id = (select auth.uid())
    )
  );

-- ─────────────────────────── Data API grants ───────────────────────────
grant select, insert, update on public.customer_orders to authenticated;
grant select, insert on public.customer_order_items to authenticated;
revoke all on public.customer_orders from anon;
revoke all on public.customer_order_items from anon;
