-- ============================================================================
-- Widen app_login.language to support the new UI languages (Hindi, Kannada,
-- Telugu, Tulu) alongside the existing English/Tamil.
--
-- Run in the Supabase SQL Editor (project ref: rcsayomijvykveqvarsq).
-- Safe to re-run: every statement is idempotent.
-- ============================================================================

alter table public.app_login drop constraint if exists app_login_language_check;

alter table public.app_login
  add constraint app_login_language_check
  check (language in ('en', 'ta', 'hi', 'kn', 'te', 'tcy'));
