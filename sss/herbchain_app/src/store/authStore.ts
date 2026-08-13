import { create } from 'zustand';
import type { User } from '@/types';
import { MOCK_USER } from '@/data/mockUser';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  hasSeenOnboarding: boolean;
  login: (user: User) => void;
  loginAsGuest: () => void;
  logout: () => void;
  setOnboardingSeen: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isGuest: false,
  hasSeenOnboarding: false,
  login: (user) => set({ user, isAuthenticated: true, isGuest: false }),
  loginAsGuest: () =>
    set({
      user: { id: 'guest', name: 'Guest', email: '', phone: '', language: 'en', isGuest: true },
      isAuthenticated: true,
      isGuest: true,
    }),
  logout: () => set({ user: null, isAuthenticated: false, isGuest: false }),
  setOnboardingSeen: () => set({ hasSeenOnboarding: true }),
  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),
}));

// Demo helper — quick login with mock user
export const demoLogin = () => {
  useAuthStore.getState().login(MOCK_USER);
};
