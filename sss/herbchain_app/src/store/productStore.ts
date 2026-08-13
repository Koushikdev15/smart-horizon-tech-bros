import { create } from 'zustand';
import type { ScanHistoryItem, Alert } from '@/types';
import { MOCK_SCAN_HISTORY, MOCK_SAVED_PRODUCT_IDS } from '@/data/mockUser';
import { MOCK_ALERTS } from '@/data/mockAlerts';

interface ProductState {
  scanHistory: ScanHistoryItem[];
  savedProductIds: string[];
  alerts: Alert[];
  isOffline: boolean;
  addScan: (item: ScanHistoryItem) => void;
  toggleSaved: (productId: string) => void;
  isSaved: (productId: string) => boolean;
  markAlertRead: (alertId: string) => void;
  unreadAlertCount: () => number;
  setOffline: (offline: boolean) => void;
  loadDemoData: () => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  scanHistory: [],
  savedProductIds: [],
  alerts: [],
  isOffline: false,
  addScan: (item) =>
    set((state) => ({
      scanHistory: [item, ...state.scanHistory.filter((s) => s.id !== item.id)],
    })),
  toggleSaved: (productId) =>
    set((state) => ({
      savedProductIds: state.savedProductIds.includes(productId)
        ? state.savedProductIds.filter((id) => id !== productId)
        : [...state.savedProductIds, productId],
    })),
  isSaved: (productId) => get().savedProductIds.includes(productId),
  markAlertRead: (alertId) =>
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === alertId ? { ...a, read: true } : a)),
    })),
  unreadAlertCount: () => get().alerts.filter((a) => !a.read).length,
  setOffline: (offline) => set({ isOffline: offline }),
  loadDemoData: () =>
    set({
      scanHistory: MOCK_SCAN_HISTORY,
      savedProductIds: [...MOCK_SAVED_PRODUCT_IDS],
      alerts: [...MOCK_ALERTS],
    }),
}));
