import { supabase } from '@/lib/supabase';
import { apiRequest } from '@/lib/api';
import type { User } from '@/types';

/** Row shape of public.app_login (see herbchain_app/supabase/migrations/0004_app_login_and_ayurvedic_id.sql). */
export interface AppLoginRow {
  id: string;
  ayurvedic_id: string;
  full_name: string;
  email: string;
  phone: string;
  language: 'en' | 'ta' | 'hi' | 'kn' | 'te' | 'tcy';
  role: string;
  date_of_birth: string | null;
  aadhaar_last4: string | null;
  pan_last4: string | null;
  occupation: string | null;
  religion: string | null;
  region: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  profile_completion: number;
}

/** Maps a public.app_login row onto the app's existing `User` type. */
export function mapAppLoginRow(row: AppLoginRow): User {
  return {
    id: row.id,
    ayurvedicId: row.ayurvedic_id,
    name: row.full_name,
    email: row.email,
    phone: row.phone,
    language: row.language || 'en',
    isGuest: false,
    dateOfBirth: row.date_of_birth ?? undefined,
    aadhaarLast4: row.aadhaar_last4 ?? undefined,
    panLast4: row.pan_last4 ?? undefined,
    occupation: row.occupation ?? undefined,
    religion: row.religion ?? undefined,
    region: row.region ?? undefined,
    address: row.address ?? undefined,
    coordinates:
      row.latitude != null && row.longitude != null
        ? { latitude: row.latitude, longitude: row.longitude }
        : undefined,
    profileCompletion: row.profile_completion,
  };
}

export function friendlyAuthError(err: unknown): string {
  const message = err instanceof Error ? err.message : undefined;
  if (!message) return 'Something went wrong. Please try again.';
  if (/invalid login credentials/i.test(message)) return 'Incorrect email or password.';
  if (/email not confirmed/i.test(message)) return 'Please confirm your email before signing in.';
  if (/rate limit|too many/i.test(message)) return 'Too many attempts. Please wait a few minutes and try again.';
  if (/network|fetch/i.test(message)) return "Couldn't reach the server. Check your connection and try again.";
  return message;
}

async function fetchAppLoginRow(userId: string): Promise<AppLoginRow> {
  const { data, error } = await supabase.from('app_login').select('*').eq('id', userId).single();
  if (error || !data) throw error ?? new Error('Profile not found.');
  return data as AppLoginRow;
}

export interface LoginResult {
  ok: boolean;
  user?: User;
  error?: string;
}

export const authService = {
  /**
   * Signs in with email + password, then checks the returned account's own
   * Ayurvedic ID against the one the user typed — same disambiguation
   * pattern herbchain_web's Login screen uses. A mismatch signs the (correct
   * credentials, wrong claimed ID) session back out rather than letting it
   * stand, since the three fields together are the intended login contract.
   */
  async login(ayurvedicId: string, email: string, password: string): Promise<LoginResult> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error || !data.session) {
      return { ok: false, error: friendlyAuthError(error) };
    }

    let row: AppLoginRow;
    try {
      row = await fetchAppLoginRow(data.session.user.id);
    } catch {
      await supabase.auth.signOut();
      return { ok: false, error: 'Could not load your profile. Please try again.' };
    }

    if (row.ayurvedic_id.trim().toUpperCase() !== ayurvedicId.trim().toUpperCase()) {
      await supabase.auth.signOut();
      return { ok: false, error: 'Ayurvedic ID does not match this account.' };
    }

    // Best-effort — never blocks sign-in on failure.
    void supabase.from('app_login').update({ last_login_at: new Date().toISOString() }).eq('id', row.id);

    return { ok: true, user: mapAppLoginRow(row) };
  },

  /** Re-fetches the signed-in user's profile for the current Supabase session. */
  async fetchProfile(): Promise<User> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not signed in.');
    const row = await fetchAppLoginRow(user.id);
    return mapAppLoginRow(row);
  },

  /**
   * Permanently deletes the account and every row it owns (health profile,
   * scan/chat history, orders, forum posts, reviews — anything FK'd to it
   * with on-delete-cascade), via the backend's service-role-only endpoint.
   * Irreversible — the caller is responsible for confirming with the user
   * first. Signs the local session out afterward regardless of outcome,
   * since a deleted account shouldn't leave a live client-side session.
   */
  async deleteAccount(): Promise<void> {
    try {
      await apiRequest('/account', { method: 'DELETE' });
    } finally {
      await supabase.auth.signOut();
    }
  },
};
