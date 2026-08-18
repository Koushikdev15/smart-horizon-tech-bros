import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  message: string | null;
  type: ToastType;
  /** Bumped on every show() so the host can restart its auto-dismiss timer even if the same message repeats. */
  token: number;
  show: (message: string, type?: ToastType) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  type: 'success',
  token: 0,

  show: (message, type = 'success') =>
    set((s) => ({ message, type, token: s.token + 1 })),

  hide: () => set({ message: null }),
}));
