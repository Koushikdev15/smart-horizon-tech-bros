import { apiRequest, ApiError, setAuthToken } from '@/lib/api';
import { last4 } from '@/lib/validation';
import { mapBackendUser, friendlyAuthError, type AuthTokens, type BackendUser } from './authService';
import type { ConsentRecord, User, WellnessProfile } from '@/types';

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
  user?: User;
  tokens?: AuthTokens;
  /** Always false against the Express backend — kept so callers that still
   *  check it (there is no email-confirmation step here) stay harmless. */
  needsEmailConfirmation?: boolean;
  error?: string;
}

/** DD/MM/YYYY → YYYY-MM-DD for the backend's ISO date field. */
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

export const registrationService = {
  /**
   * Creates the account on the Express backend, then writes the health
   * profile (only with consent) using the token the register call just
   * issued.
   *
   * Sensitive-data policy: the full Aadhaar and PAN entered during registration
   * never leave the device — only the last four characters of each are sent, and
   * the raw values are dropped when the draft goes out of scope. Nothing here
   * logs the draft.
   */
  async register(draft: RegistrationDraft): Promise<RegistrationResult> {
    const phone = normalisePhone(draft.phone);
    const dob = toIsoDate(draft.dateOfBirth);

    let payload: { user: BackendUser; token: string; refreshToken: string };
    try {
      payload = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: draft.fullName.trim(),
          email: draft.email.trim().toLowerCase(),
          mobile: phone,
          password: draft.password,
          role: 'Customer',
          language: draft.language,
          dateOfBirth: dob || undefined,
          aadhaarLast4: draft.aadhaar ? last4(draft.aadhaar) : undefined,
          panLast4: draft.pan ? draft.pan.trim().toUpperCase().slice(-4) : undefined,
          occupation: draft.occupation || undefined,
          religion: draft.religion || undefined,
          region: draft.region || undefined,
          address: draft.address || undefined,
          coordinates: draft.coordinates,
          profileCompletion: computeProfileCompletion(draft),
        }),
      });
    } catch (err) {
      return { ok: false, error: friendlyAuthError(err) };
    }

    // The account exists — everything below is best-effort on top of it, so a
    // failure here must not be reported as registration failure.
    setAuthToken(payload.token);

    let warning: string | undefined;
    if (draft.wellnessProvided && draft.consent.storeHealthData) {
      const w = draft.wellness;
      try {
        await apiRequest('/health-profile', {
          method: 'PUT',
          body: JSON.stringify({
            hasAllergies: w.hasAllergies,
            allergies: w.allergies,
            allergyNotes: w.allergyNotes || undefined,
            hasCurrentHealthIssues: w.hasCurrentHealthIssues,
            currentHealthIssues: w.currentHealthIssues || undefined,
            hasExistingConditions: w.hasExistingConditions,
            conditions: w.conditions,
            medicalHistory: w.medicalHistory || undefined,
            currentMedications: w.currentMedications || undefined,
            consentStoreHealthData: true,
            consentPersonalizedAlerts: draft.consent.personalizedAlerts,
          } satisfies Record<string, unknown>),
        });
      } catch (err) {
        warning = `Your account was created, but the wellness profile could not be saved: ${
          err instanceof ApiError ? err.message : 'unknown error'
        }`;
      }
    }

    return {
      ok: true,
      userId: payload.user.id,
      user: mapBackendUser(payload.user),
      tokens: { token: payload.token, refreshToken: payload.refreshToken },
      error: warning,
    };
  },

  /** Re-fetches the signed-in user's profile using the currently-set token. */
  async fetchProfile(): Promise<User> {
    const profile = await apiRequest<BackendUser>('/auth/profile');
    return mapBackendUser(profile);
  },
};
