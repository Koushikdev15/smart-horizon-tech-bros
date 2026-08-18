-- ============================================================================
-- AyurTrace+ customer_complaints
--
-- Run in the Supabase SQL Editor (project ref: rcsayomijvykveqvarsq).
-- Safe to re-run: every statement is idempotent.
--
-- Design notes
--   * Field list mirrors herbchain_backend/src/models/Complaint.ts 1:1.
--   * product_id is plain text, not a foreign key: the Product catalog lives
--     in MongoDB, out of scope here — a soft cross-database reference.
--   * reviewed_by is plain text (not a FK to auth.users): admin accounts are
--     a separate MongoDB+JWT system, not Supabase Auth. The admin dashboard
--     reads/writes this table through herbchain_backend's service-role key,
--     which bypasses RLS — no admin-specific policy is needed here.
--   * Owner-only RLS for the authenticated (customer) role: a user can file a
--     complaint and read/track their own, nothing else.
-- ============================================================================

create table if not exists public.customer_complaints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_login (id) on delete cascade,

  product_id  text,
  batch_id    text,
  issue_type  text not null check (issue_type in (
    'QR not working',
    'Product details mismatch',
    'Suspicious packaging',
    'Suspicious seller',
    'Damaged product',
    'Incorrect information',
    'Other'
  )),
  description text not null,
  status      text not null default 'OPEN'
    check (status in ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED')),
  admin_notes text,
  reviewed_by text,
  reviewed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists customer_complaints_set_updated_at on public.customer_complaints;
create trigger customer_complaints_set_updated_at
  before update on public.customer_complaints
  for each row execute function public.set_updated_at();

create index if not exists customer_complaints_user_id_idx on public.customer_complaints (user_id);

-- ─────────────────────────── Row Level Security ───────────────────────────
alter table public.customer_complaints enable row level security;

drop policy if exists customer_complaints_select_own on public.customer_complaints;
create policy customer_complaints_select_own
  on public.customer_complaints for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists customer_complaints_insert_own on public.customer_complaints;
create policy customer_complaints_insert_own
  on public.customer_complaints for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- ─────────────────────────── Data API grants ───────────────────────────
grant select, insert on public.customer_complaints to authenticated;
revoke all on public.customer_complaints from anon;
