import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

/** Fixed session lifetime — matches a typical government-portal working session. */
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

interface AuthState {
  user: User | null;
  token: string | null;
  /** Epoch ms after which the session must be treated as expired, regardless of activity. */
  expiresAt: number | null;
  setAuth: (user: User, token: string) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
  /** True only when a user + token are present AND the session hasn't passed expiresAt. */
  isSessionValid: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      expiresAt: null,
      setAuth: (user, token) => set({ user, token, expiresAt: Date.now() + SESSION_DURATION_MS }),
      updateUser: (updatedFields) => set((state) => ({ user: state.user ? { ...state.user, ...updatedFields } : null })),
      logout: () => set({ user: null, token: null, expiresAt: null }),
      isSessionValid: () => {
        const { user, token, expiresAt } = get();
        return Boolean(user) && Boolean(token) && Boolean(expiresAt) && Date.now() < (expiresAt as number);
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
