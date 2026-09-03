-- ============================================================================
-- AyurTrace+ chat retention — auto-delete chat sessions (and their messages,
-- via the existing on-delete-cascade FK) after 3 days of inactivity.
--
-- Run in the Supabase SQL Editor (project ref: rcsayomijvykveqvarsq).
-- Safe to re-run: every statement is idempotent.
--
-- Design notes
--   * Basis is customer_chat_sessions.updated_at (bumped on every new
--     message by the existing customer_chat_sessions_set_updated_at
--     trigger from 0008), not created_at — a conversation still being used
--     shouldn't get deleted mid-use just because it started 3+ days ago.
--     It's purged 3 days after the LAST message in it, not the first.
--   * Applies to both the general "Ask AyurTrace+" chat and the doctor
--     Consult screens — both share these same two tables (no per-doctor
--     table split), so one retention policy covers both.
--   * No wrapper function in the public schema on purpose: a SECURITY
--     DEFINER function there would be executable by any authenticated
--     client via the Data API (Postgres grants EXECUTE to PUBLIC by
--     default), which is a needless exposure for something that's purely
--     an internal scheduled job. The DELETE is scheduled directly instead;
--     pg_cron runs it as the role that scheduled it (postgres, via the SQL
--     Editor), which already bypasses RLS, so no bypass mechanism is needed.
-- ============================================================================

create extension if not exists pg_cron;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'purge-old-chat-sessions') then
    perform cron.unschedule('purge-old-chat-sessions');
  end if;
end $$;

select cron.schedule(
  'purge-old-chat-sessions',
  '0 3 * * *',  -- daily at 03:00 UTC
  $$delete from public.customer_chat_sessions where updated_at < now() - interval '3 days';$$
);

-- One-time immediate sweep so anything already past the 3-day threshold is
-- gone now, rather than waiting for tonight's first scheduled run.
delete from public.customer_chat_sessions where updated_at < now() - interval '3 days';
