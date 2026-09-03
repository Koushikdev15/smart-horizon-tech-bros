-- ============================================================================
-- Forum: posts (Question/Thought), comments, likes — real user-generated
-- discussion between customers.
--
-- Run in the Supabase SQL Editor (project ref: rcsayomijvykveqvarsq).
-- Safe to re-run: every statement is idempotent.
--
-- Design notes
--   * Requires an account (like chat/e-buy) — select/insert both gated to
--     `authenticated`, not `anon`. Not sensitive data, just not meant for a
--     signed-out browsing experience.
--   * Owner-scoped write policies for posts/comments (auth.uid() = user_id),
--     matching every other user-generated table this session
--     (customer_complaints, customer_chat_*, product_reviews).
--   * forum_likes is a plain join table — "like" = insert your own row,
--     "unlike" = delete it. No update policy needed.
-- ============================================================================

create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_login(id) on delete cascade,
  post_type text not null check (post_type in ('question', 'thought')),
  title text not null,
  body text not null,
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists forum_posts_type_created_idx
  on public.forum_posts (post_type, created_at desc);

create table if not exists public.forum_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  user_id uuid not null references public.app_login(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists forum_comments_post_idx on public.forum_comments (post_id, created_at);

create table if not exists public.forum_likes (
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  user_id uuid not null references public.app_login(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- ─────────────────────────── Row Level Security ───────────────────────────
alter table public.forum_posts enable row level security;
alter table public.forum_comments enable row level security;
alter table public.forum_likes enable row level security;

drop policy if exists forum_posts_select on public.forum_posts;
create policy forum_posts_select on public.forum_posts for select to authenticated using (true);
drop policy if exists forum_posts_insert on public.forum_posts;
create policy forum_posts_insert on public.forum_posts for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists forum_posts_update on public.forum_posts;
create policy forum_posts_update on public.forum_posts for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists forum_posts_delete on public.forum_posts;
create policy forum_posts_delete on public.forum_posts for delete to authenticated using (auth.uid() = user_id);

drop policy if exists forum_comments_select on public.forum_comments;
create policy forum_comments_select on public.forum_comments for select to authenticated using (true);
drop policy if exists forum_comments_insert on public.forum_comments;
create policy forum_comments_insert on public.forum_comments for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists forum_comments_delete on public.forum_comments;
create policy forum_comments_delete on public.forum_comments for delete to authenticated using (auth.uid() = user_id);

drop policy if exists forum_likes_select on public.forum_likes;
create policy forum_likes_select on public.forum_likes for select to authenticated using (true);
drop policy if exists forum_likes_insert on public.forum_likes;
create policy forum_likes_insert on public.forum_likes for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists forum_likes_delete on public.forum_likes;
create policy forum_likes_delete on public.forum_likes for delete to authenticated using (auth.uid() = user_id);

-- ─────────────────────────── Data API grants ───────────────────────────
grant select, insert, update, delete on public.forum_posts to authenticated;
grant select, insert, delete on public.forum_comments to authenticated;
grant select, insert, delete on public.forum_likes to authenticated;

-- ─────────────────────────── Storage bucket ───────────────────────────
insert into storage.buckets (id, name, public)
values ('forum-content', 'forum-content', true)
on conflict (id) do nothing;

drop policy if exists forum_content_public_read on storage.objects;
create policy forum_content_public_read
  on storage.objects for select
  to authenticated
  using (bucket_id = 'forum-content');

drop policy if exists forum_content_own_upload on storage.objects;
create policy forum_content_own_upload
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'forum-content' and owner = auth.uid());
