import { create } from 'zustand';

export interface CartItem {
  productId: string;
  productName: string;
  storeId: string;
  storeName: string;
  unitPrice: number;
  quantity: number;
  selected: boolean;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity' | 'selected'>, quantity: number) => void;
  updateQuantity: (productId: string, storeId: string, quantity: number) => void;
  removeItem: (productId: string, storeId: string) => void;
  toggleSelected: (productId: string, storeId: string) => void;
  removeSelected: () => void;
  clear: () => void;
}

const sameLine = (a: { productId: string; storeId: string }, productId: string, storeId: string) =>
  a.productId === productId && a.storeId === storeId;

export const useCartStore = create<CartState>((set) => ({
  items: [],

  addItem: (item, quantity) =>
    set((state) => {
      const existing = state.items.find((i) => sameLine(i, item.productId, item.storeId));
      if (existing) {
        return {
          items: state.items.map((i) =>
            sameLine(i, item.productId, item.storeId) ? { ...i, quantity: i.quantity + quantity } : i
          ),
        };
      }
      return { items: [...state.items, { ...item, quantity, selected: true }] };
    }),

  updateQuantity: (productId, storeId, quantity) =>
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((i) => !sameLine(i, productId, storeId))
          : state.items.map((i) => (sameLine(i, productId, storeId) ? { ...i, quantity } : i)),
    })),

  removeItem: (productId, storeId) =>
    set((state) => ({ items: state.items.filter((i) => !sameLine(i, productId, storeId)) })),

  toggleSelected: (productId, storeId) =>
    set((state) => ({
      items: state.items.map((i) => (sameLine(i, productId, storeId) ? { ...i, selected: !i.selected } : i)),
    })),

  removeSelected: () => set((state) => ({ items: state.items.filter((i) => !i.selected) })),

  clear: () => set({ items: [] }),
}));
