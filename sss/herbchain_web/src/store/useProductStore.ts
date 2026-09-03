import { useEffect } from 'react';
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { subscribeToTable } from '../lib/realtimeSubscription';
import type { Product } from '../types';

/**
 * Finished products, persisted in Supabase (public.products).
 *
 * Mirrors useBatchStore: a product created by a Manufacturer must be visible to
 * Supply Chain, the Government portal, and — via the printed QR — to the public
 * verification page, which reads this table anonymously.
 */
interface ProductStore {
  products: Product[];
  loading: boolean;
  error: string | null;
  loaded: boolean;

  loadProducts: () => Promise<void>;
  subscribe: () => () => void;

  addProduct: (product: Product) => Promise<Product>;
  patchProduct: (id: string, patch: Partial<Product>) => Promise<void>;
}

type Row = { id: string; payload: Product };

const rowToProduct = (row: Row): Product => ({ ...row.payload, id: row.id });

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  loading: false,
  error: null,
  loaded: false,

  loadProducts: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('products')
      .select('id, payload')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load products:', error);
      set({ loading: false, error: error.message, loaded: true });
      return;
    }

    set({
      products: (data as Row[]).map(rowToProduct),
      loading: false,
      error: null,
      loaded: true,
    });
  },

  /** Live updates. The channel is shared, so several hooks may watch the same
   *  table without the second one throwing. */
  subscribe: () => subscribeToTable('products', () => get().loadProducts()),

  addProduct: async (product) => {
    const { data, error } = await supabase
      .from('products')
      .insert({ payload: product })
      .select('id, payload')
      .single();

    if (error) {
      console.error('Failed to save product:', error);
      set({ error: error.message });
      throw error;
    }

    const saved = rowToProduct(data as Row);
    set((state) => ({ products: [saved, ...state.products], error: null }));
    return saved;
  },

  patchProduct: async (id, patch) => {
    const current = get().products.find((p) => p.id === id);
    if (!current) return;

    const next: Product = { ...current, ...patch };
    set((state) => ({ products: state.products.map((p) => (p.id === id ? next : p)) }));

    const { error } = await supabase
      .from('products')
      .update({ payload: { ...next, id: undefined } })
      .eq('id', id);

    if (error) {
      console.error('Failed to patch product:', error);
      set({ error: error.message });
      throw error;
    }
  },
}));

/**
 * Fetches products on mount and keeps them live for as long as the screen is
 * shown. Safe to call from several screens at once — the fetch is guarded so
 * only the first mount hits the network.
 */
export function useProductsLive() {
  const loading = useProductStore((s) => s.loading);
  const error = useProductStore((s) => s.error);

  useEffect(() => {
    const { loaded, loading: isLoading, loadProducts, subscribe } = useProductStore.getState();
    if (!loaded && !isLoading) void loadProducts();
    return subscribe();
  }, []);

  return { loading, error };
}
