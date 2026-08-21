-- ============================================================================
-- customer_orders: add Razorpay order/payment reference columns.
--
-- Run in the Supabase SQL Editor (project ref: rcsayomijvykveqvarsq).
-- Safe to re-run: every statement is idempotent.
--
-- No RLS change needed — the existing owner-only policies on customer_orders
-- are row-level (auth.uid() = user_id), which already covers these new
-- nullable columns automatically.
-- ============================================================================

alter table public.customer_orders
  add column if not exists razorpay_order_id text,
  add column if not exists razorpay_payment_id text;
