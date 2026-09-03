import { useEffect } from 'react';
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { subscribeToTable } from '../lib/realtimeSubscription';
import { mockBatches } from '../lib/mockData';
import type { Batch, BatchTimelineEvent } from '../types';

/**
 * Batches are persisted in Supabase (public.batches) so a batch created by a
 * Collection Centre is visible to Processing, Manufacturing, Supply Chain and
 * the Government portal — and survives a page reload.
 *
 * The public API (`batches`, `addBatch`, `updateBatchStatus`, `rejectBatch`) is
 * unchanged from the previous in-memory version, so every consuming screen keeps
 * working; the mutations now write through to the database.
 *
 * `mockBatches` are still shown alongside real rows as demo seed data, so the
 * role dashboards aren't empty before any real batch exists.
 */
interface BatchStore {
  batches: Batch[];
  loading: boolean;
  error: string | null;
  loaded: boolean;

  loadBatches: () => Promise<void>;
  subscribe: () => () => void;

  addBatch: (batch: Batch) => Promise<void>;
  /** Merges arbitrary fields into a batch and persists them. */
  patchBatch: (id: string, patch: Partial<Batch>, event?: BatchTimelineEvent) => Promise<void>;
  updateBatchStatus: (id: string, status: Batch['status'], newEvent: BatchTimelineEvent) => Promise<void>;
  rejectBatch: (id: string, stage: string, reason: string) => Promise<void>;
}

/** Demo seeds are identified so they're never written back to the database. */
const mockIds = new Set(mockBatches.map((b) => b.id));
const isMock = (id: string) => mockIds.has(id);

type Row = { id: string; payload: Batch };

const rowToBatch = (row: Row): Batch => ({ ...row.payload, id: row.id });

export const useBatchStore = create<BatchStore>((set, get) => ({
  batches: mockBatches,
  loading: false,
  error: null,
  loaded: false,

  loadBatches: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('batches')
      .select('id, payload')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load batches:', error);
      // Keep the demo seeds visible rather than blanking the screen.
      set({ loading: false, error: error.message, loaded: true });
      return;
    }

    const real = (data as Row[]).map(rowToBatch);
    set({
      batches: [...real, ...mockBatches],
      loading: false,
      error: null,
      loaded: true,
    });
  },

  /** Live updates. The channel is shared, so several hooks may watch the same
   *  table without the second one throwing. */
  subscribe: () => subscribeToTable('batches', () => get().loadBatches()),

  addBatch: async (batch) => {
    // Show it straight away, then reconcile with the row the database returns.
    set((state) => ({ batches: [batch, ...state.batches] }));

    const { data, error } = await supabase
      .from('batches')
      .insert({ payload: batch })
      .select('id, payload')
      .single();

    if (error) {
      console.error('Failed to save batch:', error);
      set({ error: error.message });
      throw error;
    }

    const saved = rowToBatch(data as Row);
    set((state) => ({
      batches: state.batches.map((b) => (b.batchNumber === saved.batchNumber ? saved : b)),
      error: null,
    }));
  },

  patchBatch: async (id, patch, event) => {
    const current = get().batches.find((b) => b.id === id);
    if (!current) return;

    const next: Batch = {
      ...current,
      ...patch,
      timeline: event ? [event, ...current.timeline] : current.timeline,
    };

    set((state) => ({ batches: state.batches.map((b) => (b.id === id ? next : b)) }));

    if (isMock(id)) return; // demo seed — nothing to persist

    const { error } = await supabase
      .from('batches')
      .update({ payload: { ...next, id: undefined } })
      .eq('id', id);

    if (error) {
      console.error('Failed to patch batch:', error);
      set({ error: error.message });
      throw error;
    }
  },

  updateBatchStatus: async (id, status, newEvent) => {
    const current = get().batches.find((b) => b.id === id);
    if (!current) return;

    const next: Batch = {
      ...current,
      status,
      currentStage: newEvent.stage,
      timeline: [newEvent, ...current.timeline],
    };

    set((state) => ({ batches: state.batches.map((b) => (b.id === id ? next : b)) }));

    if (isMock(id)) return; // demo seed — nothing to persist

    const { error } = await supabase
      .from('batches')
      .update({ payload: { ...next, id: undefined } })
      .eq('id', id);

    if (error) {
      console.error('Failed to update batch:', error);
      set({ error: error.message });
    }
  },

  rejectBatch: async (id, stage, reason) => {
    const current = get().batches.find((b) => b.id === id);
    if (!current) return;

    // `stage` arrives as a role label ("Processing & Laboratory", "Manufacturer"),
    // which is not one of the timeline's stage values — map it across, and keep
    // the original in `organization` so the rejecting party stays on the record.
    const stageMap: Record<string, BatchTimelineEvent['stage']> = {
      'Collection Center': 'Collection',
      'Processing & Laboratory': 'Laboratory',
      Processing: 'Processing',
      Manufacturer: 'Manufacturing',
      Manufacturing: 'Manufacturing',
      'Supply Chain': 'Supply Chain',
    };

    const event: BatchTimelineEvent = {
      stage: stageMap[stage] ?? 'Collection',
      timestamp: new Date().toISOString(),
      organization: stage,
      user: 'System User',
      status: 'Rejected',
      remarks: `Rejected: ${reason}`,
    };

    const next: Batch = {
      ...current,
      status: 'Rejected',
      currentStage: stage,
      timeline: [event, ...current.timeline],
    };

    set((state) => ({ batches: state.batches.map((b) => (b.id === id ? next : b)) }));

    if (isMock(id)) return;

    const { error } = await supabase
      .from('batches')
      .update({ payload: { ...next, id: undefined } })
      .eq('id', id);

    if (error) {
      console.error('Failed to reject batch:', error);
      set({ error: error.message });
    }
  },
}));

/**
 * Fetches batches on mount and keeps them live for as long as the screen is
 * shown. Safe to call from several screens at once — the fetch is guarded so
 * only the first mount hits the network.
 */
export function useBatchesLive() {
  const loading = useBatchStore((s) => s.loading);
  const error = useBatchStore((s) => s.error);

  useEffect(() => {
    const { loaded, loading: isLoading, loadBatches, subscribe } = useBatchStore.getState();
    if (!loaded && !isLoading) void loadBatches();
    return subscribe();
  }, []);

  return { loading, error };
}
