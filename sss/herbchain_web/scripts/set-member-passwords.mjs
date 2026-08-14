#!/usr/bin/env node
/**
 * Sets login passwords for existing Collection Centre members.
 *
 * These accounts were registered before the registration flow persisted
 * passwords, so their Supabase Auth users exist but have no password. This
 * script assigns the password each centre chose at registration, and confirms
 * their email so they can sign in immediately.
 *
 * Requires the service_role key — the anon key cannot modify other users.
 * NEVER commit that key or ship it to a client.
 *
 *   Usage (PowerShell):
 *     $env:SUPABASE_SERVICE_ROLE_KEY="<key>"; node scripts/set-member-passwords.mjs
 *
 *   Usage (bash):
 *     SUPABASE_SERVICE_ROLE_KEY="<key>" node scripts/set-member-passwords.mjs
 *
 * Get the key from: Supabase Dashboard → Project Settings → API → service_role.
 * Rotate it afterwards if you'd rather not keep it around.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/** Credentials as issued to each centre at registration. */
const MEMBERS = [
  { ayurvedicId: 'AYUR-CC-4NTACI', email: 'koushikiam18@gmail.com',              password: 'Demo@CC01', org: 'Western Ghats Herbal Collection Centre' },
  { ayurvedicId: 'AYUR-CC-G9CDI3', email: 'kanikarthi399@gmail.com',             password: 'Demo@CC02', org: 'Nilgiri Medicinal Plant Collection Centre' },
  { ayurvedicId: 'AYUR-CC-A7TG64', email: 'karthiga.cse2024@citchennai.net',     password: 'Demo@CC03', org: 'Erode Herbal Aggregation Centre' },
  { ayurvedicId: 'AYUR-CC-DU5MSA', email: 'pranatheeshs@gmail.com',              password: 'Demo@CC04', org: 'Kongu Ayurvedic Raw Material Centre' },
  { ayurvedicId: 'AYUR-CC-CXFBSB', email: 'pranatheeshs.aiml2024@citchennai.net', password: 'Demo@CC05', org: 'Anamalai Herb Collection Hub' },
];

function readEnv(name) {
  const envPath = resolve(here, '..', '.env');
  try {
    const line = readFileSync(envPath, 'utf8')
      .split('\n')
      .find((l) => l.startsWith(`${name}=`));
    return line ? line.slice(name.length + 1).trim() : undefined;
  } catch {
    return undefined;
  }
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? readEnv('VITE_SUPABASE_URL');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error('✗ Missing VITE_SUPABASE_URL (checked env and herbchain_web/.env)');
  process.exit(1);
}
if (!SERVICE_KEY) {
  console.error('✗ Missing SUPABASE_SERVICE_ROLE_KEY.');
  console.error('  Supabase Dashboard → Project Settings → API → service_role');
  console.error('  Then: SUPABASE_SERVICE_ROLE_KEY="<key>" node scripts/set-member-passwords.mjs');
  process.exit(1);
}

const adminHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

/** Finds an auth user by email via the admin list endpoint. */
async function findUser(email) {
  const url = `${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1000`;
  const res = await fetch(url, { headers: adminHeaders });
  if (!res.ok) throw new Error(`admin list failed: ${res.status} ${await res.text()}`);
  const body = await res.json();
  const users = body.users ?? body;
  return users.find((u) => (u.email ?? '').toLowerCase() === email.toLowerCase());
}

async function createUser({ email, password }) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (!res.ok) throw new Error(`create failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function updateUser(id, { password }) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${id}`, {
    method: 'PUT',
    headers: adminHeaders,
    // email_confirm ensures a never-confirmed account can still sign in.
    body: JSON.stringify({ password, email_confirm: true }),
  });
  if (!res.ok) throw new Error(`update failed: ${res.status} ${await res.text()}`);
  return res.json();
}

/** Proves the credential actually works, using the public anon flow. */
async function verifyLogin(email, password) {
  const anon = process.env.VITE_SUPABASE_ANON_KEY ?? readEnv('VITE_SUPABASE_ANON_KEY');
  if (!anon) return { ok: false, reason: 'no anon key to verify with' };

  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (res.ok) return { ok: true };
  const body = await res.json().catch(() => ({}));
  return { ok: false, reason: body.msg ?? body.error_description ?? `HTTP ${res.status}` };
}

const results = [];

for (const m of MEMBERS) {
  process.stdout.write(`• ${m.ayurvedicId.padEnd(16)} ${m.email.padEnd(40)} `);
  try {
    const existing = await findUser(m.email);
    if (existing) {
      await updateUser(existing.id, { password: m.password });
    } else {
      await createUser(m);
    }

    const check = await verifyLogin(m.email, m.password);
    if (check.ok) {
      console.log('✓ password set, sign-in verified');
      results.push({ ...m, status: 'ok' });
    } else {
      console.log(`⚠ password set, but sign-in failed: ${check.reason}`);
      results.push({ ...m, status: `unverified: ${check.reason}` });
    }
  } catch (err) {
    console.log(`✗ ${err.message}`);
    results.push({ ...m, status: `failed: ${err.message}` });
  }
}

const okCount = results.filter((r) => r.status === 'ok').length;
console.log(`\n${okCount}/${MEMBERS.length} accounts ready to sign in.`);
if (okCount < MEMBERS.length) {
  console.log('Failures above list the exact reason.');
  process.exitCode = 1;
}
