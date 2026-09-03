-- ============================================================================
-- AyurTrace+ customer_complaints photo attachment
--
-- Run in the Supabase SQL Editor (project ref: rcsayomijvykveqvarsq).
-- Safe to re-run: every statement is idempotent.
--
-- Design notes
--   * Report Product Issue previously simulated a photo upload (a boolean
--     toggle only) — no file was ever actually attached. This adds a real
--     column plus a user-writable storage bucket, same pattern as
--     0014_forum.sql's forum-content bucket: public read, owner-scoped
--     insert (owner = auth.uid()).
-- ============================================================================

alter table public.customer_complaints
  add column if not exists photo_url text;

-- ─────────────────────────── Storage bucket ───────────────────────────
insert into storage.buckets (id, name, public)
values ('complaint-photos', 'complaint-photos', true)
on conflict (id) do nothing;

drop policy if exists complaint_photos_public_read on storage.objects;
create policy complaint_photos_public_read
  on storage.objects for select
  to authenticated
  using (bucket_id = 'complaint-photos');

drop policy if exists complaint_photos_own_upload on storage.objects;
create policy complaint_photos_own_upload
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'complaint-photos' and owner = auth.uid());
