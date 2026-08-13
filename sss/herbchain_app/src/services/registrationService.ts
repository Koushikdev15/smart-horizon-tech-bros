import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { last4 } from '@/lib/validation';
import type { ConsentRecord, TriState, WellnessProfile } from '@/types';

export interface RegistrationDraft {
  // Step 1 — Account
  fullName: string;
  email: string;
  phone: string;
  password: string;
  language: 'en' | 'ta';

  // Step 2 — Identity
  dateOfBirth: string; // DD/MM/YYYY
  aadhaar: string;
  pan: string;
  occupation: string;
  religion: string;

  // Step 3 — Location
  region: string;
  address: string;
  coordinates?: { latitude: number; longitude: number };

  // Step 4 — Wellness (optional; skippable)
  wellness: WellnessProfile;
  wellnessProvided: boolean;

  // Step 5 — Consent
  consent: ConsentRecord;
}

export interface RegistrationResult {
  ok: boolean;
  userId?: string;
  /** True when Supabase requires email confirmation before a session exists. */
  needsEmailConfirmation?: boolean;
  error?: string;
}

/** DD/MM/YYYY → YYYY-MM-DD for a Postgres `date` column. */
function toIsoDate(ddmmyyyy: string): string | null {
  const m = ddmmyyyy.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function normalisePhone(v: string): string {
  return v.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
}

/** Weights the five registration sections into a 0-100 completeness figure. */
export function computeProfileCompletion(draft: RegistrationDraft): number {
  const sections = [
    // Account is mandatory to get this far.
    true,
    Boolean(draft.dateOfBirth && draft.aadhaar && draft.pan),
    Boolean(draft.region && draft.address),
    draft.wellnessProvided,
    Boolean(draft.consent.terms && draft.consent.privacy),
  ];
  const done = sections.filter(Boolean).length;
  return Math.round((done / sections.length) * 100);
}

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (m.includes('password')) return 'That password was rejected. Use at least 8 characters.';
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  if (m.includes('network') || m.includes('fetch')) {
    return "Couldn't reach the server. Check your connection and try again.";
  }
  return message;
}

export const registrationService = {
  /**
   * Creates the auth user, then writes the profile and (only with consent) the
   * wellness record.
   *
   * Sensitive-data policy: the full Aadhaar and PAN entered during registration
   * never leave the device — only the last four characters of each are sent, and
   * the raw values are dropped when the draft goes out of scope. Nothing here
   * logs the draft.
   */
  async register(draft: RegistrationDraft): Promise<RegistrationResult> {
    if (!isSupabaseConfigured) {
      return { ok: false, error: 'Supabase is not configured. Add your keys to .env and restart.' };
    }

    const phone = normalisePhone(draft.phone);
    const dob = toIsoDate(draft.dateOfBirth);

    // 1 — Auth account.
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: draft.email.trim().toLowerCase(),
      password: draft.password,
      options: {
        data: {
          // Display-only metadata. This is user-editable and must never be used
          // for authorization decisions.
          full_name: draft.fullName.trim(),
          language: draft.language,
        },
      },
    });

    if (signUpError) return { ok: false, error: friendlyAuthError(signUpError.message) };

    const userId = signUpData.user?.id;
    if (!userId) return { ok: false, error: 'Account created but no user was returned.' };

    // If email confirmation is on, there is no session yet — and without a
    // session the RLS policies (correctly) reject the profile insert.
    if (!signUpData.session) {
      return { ok: true, userId, needsEmailConfirmation: true };
    }

    // 2 — Profile row. `id` must equal auth.uid() or RLS rejects the write.
    const { error: profileError } = await supabase.from('customer_profiles').insert({
      id: userId,
      full_name: draft.fullName.trim(),
      email: draft.email.trim().toLowerCase(),
      phone,
      language: draft.language,
      date_of_birth: dob,
      aadhaar_last4: draft.aadhaar ? last4(draft.aadhaar) : null,
      pan_last4: draft.pan ? draft.pan.trim().toUpperCase().slice(-4) : null,
      occupation: draft.occupation || null,
      religion: draft.religion || null,
      region: draft.region || null,
      address: draft.address || null,
      latitude: draft.coordinates?.latitude ?? null,
      longitude: draft.coordinates?.longitude ?? null,
      consent_terms: draft.consent.terms,
      consent_privacy: draft.consent.privacy,
      consent_store_health_data: draft.consent.storeHealthData,
      consent_personalized_alerts: draft.consent.personalizedAlerts,
      consent_accepted_at: new Date().toISOString(),
      profile_completion: computeProfileCompletion(draft),
    });

    if (profileError) {
      return {
        ok: false,
        userId,
        error:
          profileError.code === '23505'
            ? 'That mobile number is already registered.'
            : `Could not save your profile: ${profileError.message}`,
      };
    }

    // 3 — Wellness row, written only when the user both supplied data and
    // explicitly consented to it being stored.
    if (draft.wellnessProvided && draft.consent.storeHealthData) {
      const w = draft.wellness;
      const { error: wellnessError } = await supabase.from('customer_wellness').insert({
        user_id: userId,
        has_allergies: w.hasAllergies as TriState,
        allergies: w.allergies,
        allergy_notes: w.allergyNotes || null,
        has_current_issues: w.hasCurrentHealthIssues as TriState,
        current_health_issues: w.currentHealthIssues || null,
        has_existing_conditions: w.hasExistingConditions as TriState,
        conditions: w.conditions,
        medical_history: w.medicalHistory || null,
        current_medications: w.currentMedications || null,
      });

      // The account and profile already exist, so a wellness failure is not
      // fatal — surface it without discarding a successful registration.
      if (wellnessError) {
        return {
          ok: true,
          userId,
          error: `Your account was created, but the wellness profile could not be saved: ${wellnessError.message}`,
        };
      }
    }

    return { ok: true, userId };
  },

  /** Loads the signed-in user's profile (RLS scopes this to their own row). */
  async fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('customer_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
};
