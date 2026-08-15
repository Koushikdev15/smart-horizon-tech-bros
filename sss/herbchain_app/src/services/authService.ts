import { apiRequest, ApiError } from '@/lib/api';
import type { User } from '@/types';

export interface BackendUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  language?: 'en' | 'ta';
  dateOfBirth?: string;
  aadhaarLast4?: string;
  panLast4?: string;
  occupation?: string;
  religion?: string;
  region?: string;
  address?: string;
  coordinates?: { latitude: number; longitude: number };
  profilePhoto?: string;
  profileCompletion?: number;
}

export interface AuthTokens {
  token: string;
  refreshToken: string;
}

interface AuthPayload {
  user: BackendUser;
  token: string;
  refreshToken: string;
}

/** Maps the Express backend's User shape onto the app's existing `User` type. */
export function mapBackendUser(u: BackendUser): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.mobile,
    language: u.language || 'en',
    isGuest: false,
    dateOfBirth: u.dateOfBirth,
    aadhaarLast4: u.aadhaarLast4,
    panLast4: u.panLast4,
    occupation: u.occupation,
    religion: u.religion,
    region: u.region,
    address: u.address,
    coordinates: u.coordinates,
    profilePhoto: u.profilePhoto,
    profileCompletion: u.profileCompletion,
  };
}

export interface LoginResult {
  ok: boolean;
  user?: User;
  tokens?: AuthTokens;
  error?: string;
}

export function friendlyAuthError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 0) return err.message;
    if (err.status === 401) return 'Invalid email/mobile or password.';
    if (err.status === 429) return 'Too many attempts. Please wait a few minutes and try again.';
    return err.message;
  }
  return 'Something went wrong. Please try again.';
}

export const authService = {
  async login(identifier: string, password: string): Promise<LoginResult> {
    try {
      const result = await apiRequest<AuthPayload>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: identifier.trim(), password }),
      });
      return {
        ok: true,
        user: mapBackendUser(result.user),
        tokens: { token: result.token, refreshToken: result.refreshToken },
      };
    } catch (err) {
      return { ok: false, error: friendlyAuthError(err) };
    }
  },

  /** Re-fetches the signed-in user's profile using the currently-set token. */
  async fetchProfile(): Promise<User> {
    const profile = await apiRequest<BackendUser>('/auth/profile');
    return mapBackendUser(profile);
  },
};
