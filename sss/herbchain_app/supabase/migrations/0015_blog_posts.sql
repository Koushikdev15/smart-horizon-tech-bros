create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  excerpt text not null,
  body text not null,
  image_url text not null,
  author text not null default 'AyurTrace+ Team',
  published_at timestamptz not null default now()
);

create index if not exists blog_posts_published_idx on public.blog_posts (published_at desc);

alter table public.blog_posts enable row level security;

create policy "blog_posts_public_read" on public.blog_posts
  for select
  to anon, authenticated
  using (true);

grant select on public.blog_posts to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('blog-content', 'blog-content', true)
on conflict (id) do nothing;

create policy "blog_content_public_read" on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'blog-content');
