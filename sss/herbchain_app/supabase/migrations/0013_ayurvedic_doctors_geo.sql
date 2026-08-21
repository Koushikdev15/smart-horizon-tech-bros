-- ============================================================================
-- ayurvedic_doctors: add real coordinates + phone, now that a geocoded CSV is
-- available — the Doctor Portal can compute genuine "nearest by distance"
-- instead of the earlier district-name approximation.
--
-- Run in the Supabase SQL Editor (project ref: rcsayomijvykveqvarsq).
-- Safe to re-run: every statement is idempotent.
-- ============================================================================

alter table public.ayurvedic_doctors
  add column if not exists latitude numeric,
  add column if not exists longitude numeric,
  add column if not exists phone text;
