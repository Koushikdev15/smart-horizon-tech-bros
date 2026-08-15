import { create } from 'zustand';
import type { User } from '@/types';
import { setAuthToken, apiRequest } from '@/lib/api';
import { authStorage } from '@/lib/authStorage';
import { mapBackendUser, type AuthTokens, type BackendUser } from '@/services/authService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  hasSeenOnboarding: boolean;
  /** True once the stored session has been checked on app start (or there was none). */
  hasHydrated: boolean;
  login: (user: User, tokens: AuthTokens) => Promise<void>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
  setOnboardingSeen: () => void;
  updateUser: (updates: Partial<User>) => void;
  /** Restores a persisted session on app start, if the stored token is still valid. */
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isGuest: false,
  hasSeenOnboarding: false,
  hasHydrated: false,

  login: async (user, tokens) => {
    setAuthToken(tokens.token);
    await authStorage.setTokens(tokens.token, tokens.refreshToken);
    set({ user, isAuthenticated: true, isGuest: false });
  },

  loginAsGuest: () =>
    set({
      user: { id: 'guest', name: 'Guest', email: '', phone: '', language: 'en', isGuest: true },
      isAuthenticated: true,
      isGuest: true,
    }),

  logout: async () => {
    setAuthToken(null);
    await authStorage.clear();
    set({ user: null, isAuthenticated: false, isGuest: false });
  },

  setOnboardingSeen: () => set({ hasSeenOnboarding: true }),

  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),

  hydrate: async () => {
    const token = await authStorage.getToken();
    if (!token) {
      set({ hasHydrated: true });
      return;
    }

    setAuthToken(token);
    try {
      const profile = await apiRequest<BackendUser>('/auth/profile');
      set({ user: mapBackendUser(profile), isAuthenticated: true, isGuest: false, hasHydrated: true });
    } catch {
      // Expired/invalid token — clear it and fall through to the login screen.
      setAuthToken(null);
      await authStorage.clear();
      set({ hasHydrated: true });
    }
  },
}));
