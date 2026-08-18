-- ============================================================================
-- Drop the old account_mirror table
--
-- Run in the Supabase SQL Editor (project ref: rcsayomijvykveqvarsq).
-- Safe to re-run.
--
-- account_mirror (0002_account_mirror.sql) was a write-only, service-role-only
-- copy of Mongo accounts kept for analytics — never read from, never used for
-- login. It's being replaced by public.app_login (0004), a real RLS-owned
-- table that Supabase Auth is the actual source of truth for. The backend no
-- longer writes to this table (SupabaseMirrorService is removed) — see the
-- herbchain_backend changes in the same rollout.
-- ============================================================================

drop table if exists public.account_mirror;
