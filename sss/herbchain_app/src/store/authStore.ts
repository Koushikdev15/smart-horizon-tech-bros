import { create } from 'zustand';
import type { User } from '@/types';
import { supabase } from '@/lib/supabase';
import { authService } from '@/services/authService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  hasSeenOnboarding: boolean;
  /** True once the stored session has been checked on app start (or there was none). */
  hasHydrated: boolean;
  login: (user: User) => void;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
  setOnboardingSeen: () => void;
  updateUser: (updates: Partial<User>) => void;
  /** Restores a persisted Supabase session on app start, if one is still valid. */
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isGuest: false,
  hasSeenOnboarding: false,
  hasHydrated: false,

  // Supabase's client persists and auto-refreshes the session itself (see
  // src/lib/supabase.ts) — there's no separate token to store here.
  login: (user) => set({ user, isAuthenticated: true, isGuest: false }),

  loginAsGuest: () =>
    set({
      user: { id: 'guest', name: 'Guest', email: '', phone: '', language: 'en', isGuest: true },
      isAuthenticated: true,
      isGuest: true,
    }),

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false, isGuest: false });
  },

  setOnboardingSeen: () => set({ hasSeenOnboarding: true }),

  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),

  hydrate: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      set({ hasHydrated: true });
      return;
    }

    try {
      const user = await authService.fetchProfile();
      set({ user, isAuthenticated: true, isGuest: false, hasHydrated: true });
    } catch {
      // Session valid but no matching app_login row (or some other fetch
      // failure) — clear it and fall through to the login screen.
      await supabase.auth.signOut();
      set({ hasHydrated: true });
    }
  },
}));
