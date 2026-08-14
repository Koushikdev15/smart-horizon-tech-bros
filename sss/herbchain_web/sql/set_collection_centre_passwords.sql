-- ============================================================================
-- Set login passwords for the Collection Centre accounts
--
-- WHERE: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- The SQL Editor runs as a superuser, so it can write to auth.users directly —
-- no service_role key needed.
--
-- These accounts were registered before the app persisted passwords, so their
-- auth users exist with no password. This assigns the password the admin issued
-- at registration and confirms their email so sign-in isn't blocked.
--
-- Passwords are bcrypt-hashed by pgcrypto and stored in auth.users, exactly
-- where Supabase Auth expects them — nothing is written to public.members, and
-- no plaintext is stored anywhere.
--
-- Safe to re-run: it simply re-sets the same passwords.
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- ── 0. Create any auth user that doesn't exist yet ──────────────────────────
-- Accounts registered via the "123456" demo bypass may never have reached
-- Supabase Auth. This creates them, already confirmed, so step 1 can set the
-- password uniformly. Existing users are left untouched.
insert into auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at, confirmed_at,
  created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_sso_user, is_anonymous
)
select
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  c.email,
  extensions.crypt(c.password, extensions.gen_salt('bf')),
  now(), now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  false, false
from (values
    ('koushikiam18@gmail.com',               'Demo@CC01'),
    ('kanikarthi399@gmail.com',              'Demo@CC02'),
    ('karthiga.cse2024@citchennai.net',      'Demo@CC03'),
    ('pranatheeshs@gmail.com',               'Demo@CC04'),
    ('pranatheeshs.aiml2024@citchennai.net', 'Demo@CC05')
  ) as c(email, password)
where not exists (
  select 1 from auth.users u where lower(u.email) = lower(c.email)
);

-- ── 1. Set password + confirm email ─────────────────────────────────────────
with credentials(email, password) as (
  values
    ('koushikiam18@gmail.com',               'Demo@CC01'),
    ('kanikarthi399@gmail.com',              'Demo@CC02'),
    ('karthiga.cse2024@citchennai.net',      'Demo@CC03'),
    ('pranatheeshs@gmail.com',               'Demo@CC04'),
    ('pranatheeshs.aiml2024@citchennai.net', 'Demo@CC05')
)
update auth.users u
set
  encrypted_password = extensions.crypt(c.password, extensions.gen_salt('bf')),
  -- Your project requires email confirmation; without this, sign-in fails with
  -- "Email not confirmed" even when the password is correct.
  email_confirmed_at = coalesce(u.email_confirmed_at, now()),
  confirmed_at       = coalesce(u.confirmed_at, now()),
  updated_at         = now()
from credentials c
where lower(u.email) = lower(c.email);

-- ── 2. Ensure each has an email identity ────────────────────────────────────
-- Password sign-in needs an 'email' identity row. Accounts created through the
-- OTP flow already have one; this backfills any that don't.
insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select
  gen_random_uuid(),
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email',
  u.id::text,
  now(), now(), now()
from auth.users u
where lower(u.email) in (
  'koushikiam18@gmail.com',
  'kanikarthi399@gmail.com',
  'karthiga.cse2024@citchennai.net',
  'pranatheeshs@gmail.com',
  'pranatheeshs.aiml2024@citchennai.net'
)
and not exists (
  select 1 from auth.identities i
  where i.user_id = u.id and i.provider = 'email'
);

-- ── 3. Verification report ──────────────────────────────────────────────────
-- Every row should read: password_set = true, email_confirmed = true,
-- has_email_identity = true, and member_status = 'Active'.
select
  m."ayurvedicId",
  m."organizationName",
  u.email,
  (u.encrypted_password is not null and u.encrypted_password <> '') as password_set,
  (u.email_confirmed_at is not null)                                as email_confirmed,
  exists (
    select 1 from auth.identities i
    where i.user_id = u.id and i.provider = 'email'
  )                                                                  as has_email_identity,
  m.status                                                           as member_status,
  m.role                                                             as member_role
from auth.users u
join public.members m on lower(m.email) = lower(u.email)
where lower(u.email) in (
  'koushikiam18@gmail.com',
  'kanikarthi399@gmail.com',
  'karthiga.cse2024@citchennai.net',
  'pranatheeshs@gmail.com',
  'pranatheeshs.aiml2024@citchennai.net'
)
order by m."ayurvedicId";
