import { supabase } from '@/lib/supabase';
import { last4 } from '@/lib/validation';
import { mapAppLoginRow, friendlyAuthError, type AppLoginRow } from './authService';
import type { ConsentRecord, User, WellnessProfile } from '@/types';

export interface RegistrationDraft {
  // Step 1 — Account
  fullName: string;
  email: string;
  phone: string;
  password: string;
  language: 'en' | 'ta' | 'hi' | 'kn' | 'te' | 'tcy';

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
  user?: User;
  /** True once signUp has sent the 6-digit code to the user's email — the
   *  caller should show the OTP entry step next; no app_login row exists
   *  yet (there's no session to satisfy RLS until the code is verified). */
  needsOtp?: boolean;
  error?: string;
}

/** DD/MM/YYYY → YYYY-MM-DD for Postgres's date column. */
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

/**
 * Writes the profile row (public.app_login, which generates the account's
 * Ayurvedic ID) and, with consent, the wellness row — both as the
 * now-authenticated user, so RLS just enforces itself. Shared by the (rare)
 * path where Supabase returns a session immediately, and the normal path
 * where it's called right after the signup OTP is verified.
 */
async function completeProfile(userId: string, draft: RegistrationDraft): Promise<RegistrationResult> {
  const phone = normalisePhone(draft.phone);
  const dob = toIsoDate(draft.dateOfBirth);
  const email = draft.email.trim().toLowerCase();

  const { data: inserted, error: insertError } = await supabase
    .from('app_login')
    .insert({
      id: userId,
      full_name: draft.fullName.trim(),
      email,
      phone,
      language: draft.language,
      role: 'Customer',
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
    })
    .select('*')
    .single();

  if (insertError || !inserted) {
    // The auth account exists but the profile row failed — sign back out
    // rather than leave the app in a half-created state, and surface a
    // clear error instead of a silent partial account.
    await supabase.auth.signOut();
    return { ok: false, error: `Account setup failed: ${insertError?.message ?? 'unknown error'}` };
  }

  let warning: string | undefined;
  if (draft.wellnessProvided && draft.consent.storeHealthData) {
    const w = draft.wellness;
    const { error: wellnessError } = await supabase.from('customer_wellness').insert({
      user_id: inserted.id,
      has_allergies: w.hasAllergies,
      allergies: w.allergies,
      allergy_notes: w.allergyNotes || null,
      has_current_health_issues: w.hasCurrentHealthIssues,
      current_health_issues: w.currentHealthIssues || null,
      has_existing_conditions: w.hasExistingConditions,
      conditions: w.conditions,
      medical_history_tags: w.medicalHistoryTags,
      medical_history: w.medicalHistory || null,
      current_medication_tags: w.currentMedicationTags,
      current_medications: w.currentMedications || null,
    });
    if (wellnessError) {
      warning = `Your account was created, but the wellness profile could not be saved: ${wellnessError.message}`;
    }
  }

  return { ok: true, user: mapAppLoginRow(inserted as AppLoginRow), error: warning };
}

export const registrationService = {
  /**
   * Starts account creation: creates the Supabase Auth account, which sends
   * a 6-digit verification code to the user's email (see the Supabase
   * dashboard setup notes — Auth > Providers > Email > Confirm email must be
   * ON, and the "Confirm signup" template must use {{ .Token }}). No profile
   * row is written yet — call verifySignupOtp once the user enters the code.
   */
  async startRegistration(draft: RegistrationDraft): Promise<RegistrationResult> {
    const email = draft.email.trim().toLowerCase();

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: draft.password,
    });

    if (signUpError) {
      return { ok: false, error: friendlyAuthError(signUpError) };
    }

    // Confirmation disabled on the project (not the recommended setup) —
    // a session came back immediately, so there's nothing to verify.
    if (signUpData.session && signUpData.user) {
      return completeProfile(signUpData.user.id, draft);
    }

    return { ok: true, needsOtp: true };
  },

  /** Verifies the 6-digit code emailed by startRegistration, then creates the profile. */
  async verifySignupOtp(draft: RegistrationDraft, token: string): Promise<RegistrationResult> {
    const email = draft.email.trim().toLowerCase();

    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
    if (error || !data.session || !data.user) {
      return { ok: false, error: friendlyAuthError(error) || 'Invalid or expired code. Please try again.' };
    }

    return completeProfile(data.user.id, draft);
  },

  /** Re-sends the signup verification code (rate-limited by Supabase to ~once/60s). */
  async resendSignupOtp(email: string): Promise<{ ok: boolean; error?: string }> {
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim().toLowerCase() });
    if (error) return { ok: false, error: friendlyAuthError(error) };
    return { ok: true };
  },
};
