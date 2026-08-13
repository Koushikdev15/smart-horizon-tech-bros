import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Notification, UserRole } from '../types';
import { useAuthStore } from './authStore';

const MAX_RECENT_NAV_ITEMS = 5;

// Processing & Laboratory / Manufacturer / Supply Chain all reuse the same nav-item ids
// (e.g. "rejected", "payments") — pinned/recent must be scoped per role or a page visited
// under one role would incorrectly show up as "recent"/"pinned" under an unrelated role.
type PerRoleNavItems = Partial<Record<UserRole, string[]>>;

interface AppState {
  sidebarCollapsed: boolean;
  darkMode: boolean;
  notifications: Notification[];
  activeBatchId: string | null;
  activeNavItem: string;
  pinnedNavItems: PerRoleNavItems;
  recentNavItems: PerRoleNavItems;
  toggleSidebar: () => void;
  toggleDarkMode: () => void;
  setActiveBatch: (id: string | null) => void;
  setActiveNavItem: (item: string) => void;
  togglePinnedNavItem: (id: string) => void;
  addNotification: (n: Notification) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      darkMode: true,
      activeBatchId: null,
      activeNavItem: 'dashboard',
      pinnedNavItems: {},
      recentNavItems: {},
      notifications: [
        {
          id: 'n1',
          title: 'New Batch Received',
          description: 'Batch BATCH-2026-0047 from Kerala Collection Center is awaiting processing.',
          type: 'info',
          isRead: false,
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          batchId: 'BATCH-2026-0047',
        },
        {
          id: 'n2',
          title: 'Lab Certificate Ready',
          description: 'Certificate for BATCH-2026-0042 has been generated and forwarded.',
          type: 'success',
          isRead: false,
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          batchId: 'BATCH-2026-0042',
        },
        {
          id: 'n3',
          title: 'Quality Alert',
          description: 'Batch BATCH-2026-0038 has failed heavy metals test. Review required.',
          type: 'error',
          isRead: false,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          batchId: 'BATCH-2026-0038',
        },
        {
          id: 'n4',
          title: 'Payment Released',
          description: '₹24,500 has been released to Western Ghats Collection Center.',
          type: 'success',
          isRead: true,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        },
      ],
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleDarkMode: () => set((s) => {
        const next = !s.darkMode;
        if (next) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { darkMode: next };
      }),
      setActiveBatch: (id) => set({ activeBatchId: id }),
      setActiveNavItem: (item) => set((s) => {
        const trackable = item !== 'dashboard' && item !== 'profile';
        const role = useAuthStore.getState().user?.role;
        if (!trackable || !role) return { activeNavItem: item };
        const existing = s.recentNavItems[role] ?? [];
        const updated = [item, ...existing.filter((i) => i !== item)].slice(0, MAX_RECENT_NAV_ITEMS);
        return { activeNavItem: item, recentNavItems: { ...s.recentNavItems, [role]: updated } };
      }),
      togglePinnedNavItem: (id) => set((s) => {
        const role = useAuthStore.getState().user?.role;
        if (!role) return {};
        const existing = s.pinnedNavItems[role] ?? [];
        const updated = existing.includes(id) ? existing.filter((i) => i !== id) : [...existing, id];
        return { pinnedNavItems: { ...s.pinnedNavItems, [role]: updated } };
      }),
      addNotification: (n) => set((s) => ({ notifications: [n, ...s.notifications] })),
      markAllRead: () => set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
      })),
      markRead: (id) => set((s) => ({
        notifications: s.notifications.map((n) => n.id === id ? { ...n, isRead: true } : n),
      })),
    }),
    { name: 'app-storage' }
  )
);
