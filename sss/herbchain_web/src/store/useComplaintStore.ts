import { useEffect } from 'react';
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { subscribeToTable } from '../lib/realtimeSubscription';
import type { Complaint } from '../types';

/**
 * Complaints, persisted in Supabase (public.complaints).
 *
 * Mirrors useBatchStore / useProductStore. A complaint raised by any party is
 * visible to the regulator and to whoever it concerns, and survives a reload —
 * the previous screen held them in component state seeded from a mock array,
 * so every resolution was forgotten on refresh.
 */
interface ComplaintStore {
  complaints: Complaint[];
  loading: boolean;
  error: string | null;
  loaded: boolean;
  /** True when the table has not been created yet. */
  missingTable: boolean;

  loadComplaints: () => Promise<void>;
  subscribe: () => () => void;
  addComplaint: (complaint: Complaint) => Promise<Complaint>;
  patchComplaint: (id: string, patch: Partial<Complaint>) => Promise<void>;
}

type Row = { id: string; payload: Complaint };
const rowToComplaint = (row: Row): Complaint => ({ ...row.payload, id: row.id });

/** PostgREST's code for "relation does not exist". */
const MISSING_TABLE = 'PGRST205';

export const useComplaintStore = create<ComplaintStore>((set, get) => ({
  complaints: [],
  loading: false,
  error: null,
  loaded: false,
  missingTable: false,

  loadComplaints: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('complaints')
      .select('id, payload')
      .order('created_at', { ascending: false });

    if (error) {
      const missing = error.code === MISSING_TABLE;
      if (!missing) console.error('Failed to load complaints:', error);
      set({ loading: false, error: error.message, loaded: true, missingTable: missing });
      return;
    }

    set({
      complaints: (data as Row[]).map(rowToComplaint),
      loading: false,
      error: null,
      loaded: true,
      missingTable: false,
    });
  },

  /** Live updates. The channel is shared, so several hooks may watch the same
   *  table without the second one throwing. */
  subscribe: () => subscribeToTable('complaints', () => get().loadComplaints()),

  addComplaint: async (complaint) => {
    const { data, error } = await supabase
      .from('complaints')
      .insert({ payload: complaint })
      .select('id, payload')
      .single();

    if (error) {
      console.error('Failed to file complaint:', error);
      set({ error: error.message });
      throw error;
    }
    const saved = rowToComplaint(data as Row);
    set((state) => ({ complaints: [saved, ...state.complaints], error: null }));
    return saved;
  },

  patchComplaint: async (id, patch) => {
    const current = get().complaints.find((c) => c.id === id);
    if (!current) return;

    const next: Complaint = { ...current, ...patch, updatedAt: new Date().toISOString() };
    set((state) => ({ complaints: state.complaints.map((c) => (c.id === id ? next : c)) }));

    const { error } = await supabase
      .from('complaints')
      .update({ payload: { ...next, id: undefined } })
      .eq('id', id);

    if (error) {
      console.error('Failed to update complaint:', error);
      set({ error: error.message });
      throw error;
    }
  },
}));

export function useComplaintsLive() {
  const loading = useComplaintStore((s) => s.loading);
  const error = useComplaintStore((s) => s.error);
  const missingTable = useComplaintStore((s) => s.missingTable);

  useEffect(() => {
    const { loaded, loading: isLoading, loadComplaints, subscribe } = useComplaintStore.getState();
    if (!loaded && !isLoading) void loadComplaints();
    return subscribe();
  }, []);

  return { loading, error, missingTable };
}
