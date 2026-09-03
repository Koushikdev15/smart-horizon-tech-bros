create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id text not null,
  user_id uuid not null references public.app_login(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create index if not exists product_reviews_product_idx on public.product_reviews (product_id, created_at desc);

alter table public.product_reviews enable row level security;

create policy "product_reviews_public_read" on public.product_reviews
  for select
  to anon, authenticated
  using (true);

create policy "product_reviews_own_insert" on public.product_reviews
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "product_reviews_own_update" on public.product_reviews
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "product_reviews_own_delete" on public.product_reviews
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select on public.product_reviews to anon, authenticated;
grant insert, update, delete on public.product_reviews to authenticated;

create view public.product_review_stats
  with (security_invoker = true) as
  select
    product_id,
    round(avg(rating)::numeric, 1) as avg_rating,
    count(*) as review_count
  from public.product_reviews
  group by product_id;

grant select on public.product_review_stats to anon, authenticated;
