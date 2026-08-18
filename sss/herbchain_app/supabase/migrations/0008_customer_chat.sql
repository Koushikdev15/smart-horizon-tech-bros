-- ============================================================================
-- AyurTrace+ customer_chat_sessions / customer_chat_messages
--
-- Run in the Supabase SQL Editor (project ref: rcsayomijvykveqvarsq).
-- Safe to re-run: every statement is idempotent.
--
-- Design notes
--   * Field list mirrors herbchain_backend/src/models/ChatSession.ts and
--     ChatMessage.ts 1:1. Message *writing* stays backend-mediated (the
--     Gemini API key is a server-side secret and must never reach the
--     client), using the service-role key — but owner-only RLS is still
--     defined so the app can read a user's own chat history directly.
--   * product_ids / doctor_guidance_ids are plain text[], not foreign keys:
--     Product and DoctorGuidance live in MongoDB, out of scope here.
-- ============================================================================

create table if not exists public.customer_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_login (id) on delete cascade,
  title text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.customer_chat_sessions (id) on delete cascade,

  role    text not null check (role in ('user', 'assistant')),
  content text not null,
  -- Only set on assistant messages — the internal safety classification.
  category text check (category in (
    'SAFE_INFORMATIONAL',
    'CAUTION',
    'POTENTIAL_ALLERGY_CONFLICT',
    'POTENTIAL_INTERACTION',
    'MEDICAL_CONSULTATION_RECOMMENDED',
    'URGENT_MEDICAL_ATTENTION',
    'INSUFFICIENT_INFORMATION'
  )),
  sources             jsonb not null default '[]',
  product_ids         text[] not null default '{}',
  doctor_guidance_ids text[] not null default '{}',

  created_at timestamptz not null default now()
);

drop trigger if exists customer_chat_sessions_set_updated_at on public.customer_chat_sessions;
create trigger customer_chat_sessions_set_updated_at
  before update on public.customer_chat_sessions
  for each row execute function public.set_updated_at();

create index if not exists customer_chat_sessions_user_id_idx on public.customer_chat_sessions (user_id);
create index if not exists customer_chat_messages_session_id_created_at_idx
  on public.customer_chat_messages (session_id, created_at);

-- ─────────────────────────── Row Level Security ───────────────────────────
alter table public.customer_chat_sessions enable row level security;
alter table public.customer_chat_messages enable row level security;

drop policy if exists customer_chat_sessions_select_own on public.customer_chat_sessions;
create policy customer_chat_sessions_select_own
  on public.customer_chat_sessions for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists customer_chat_sessions_insert_own on public.customer_chat_sessions;
create policy customer_chat_sessions_insert_own
  on public.customer_chat_sessions for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- customer_chat_messages has no user_id of its own — ownership is via its
-- parent session.
drop policy if exists customer_chat_messages_select_own on public.customer_chat_messages;
create policy customer_chat_messages_select_own
  on public.customer_chat_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.customer_chat_sessions s
      where s.id = customer_chat_messages.session_id
        and s.user_id = (select auth.uid())
    )
  );

drop policy if exists customer_chat_messages_insert_own on public.customer_chat_messages;
create policy customer_chat_messages_insert_own
  on public.customer_chat_messages for insert
  to authenticated
  with check (
    exists (
      select 1 from public.customer_chat_sessions s
      where s.id = customer_chat_messages.session_id
        and s.user_id = (select auth.uid())
    )
  );

-- ─────────────────────────── Data API grants ───────────────────────────
grant select, insert on public.customer_chat_sessions to authenticated;
grant select, insert on public.customer_chat_messages to authenticated;
revoke all on public.customer_chat_sessions from anon;
revoke all on public.customer_chat_messages from anon;
