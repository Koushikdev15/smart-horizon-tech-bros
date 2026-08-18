import { apiRequest } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export interface RegionAvailability {
  storeCount: number;
  minPrice?: number;
  totalQuantity?: number;
}

export interface PurchaseProduct {
  _id: string;
  productName: string;
  healthTopics: string[];
  description?: string;
  usageInstructions?: string;
  precautions?: string;
  contraindications?: string;
  ingredients: { name: string; scientificName?: string }[];
  regionAvailability: RegionAvailability | null;
}

export interface StoreOffer {
  storeId: string;
  storeName: string;
  region: string;
  address: string;
  isOpenNow: boolean | null;
  price?: number;
  quantity?: number;
}

export interface Order {
  id: string;
  items: Array<{ productName: string; storeName: string; quantity: number; unitPrice: number }>;
  totalAmount: number;
  deliveryAddress: string;
  region: string;
  paymentMethod: 'COD' | 'ONLINE';
  paymentStatus: 'COD' | 'PENDING' | 'PAID' | 'FAILED';
  orderStatus: 'PLACED' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
}

export const ebuyService = {
  async browse(params: { q?: string; healthTopic?: string; region?: string }): Promise<PurchaseProduct[]> {
    const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
    return apiRequest(`/products/purchase?${query.toString()}`);
  },

  async getOffers(productId: string, region?: string): Promise<StoreOffer[]> {
    const query = region ? `?region=${encodeURIComponent(region)}` : '';
    return apiRequest(`/products/${productId}/offers${query}`);
  },

  async placeOrder(data: {
    items: { productId: string; storeId: string; quantity: number }[];
    deliveryAddress: string;
    region: string;
    paymentMethod: 'COD' | 'ONLINE';
  }): Promise<Order> {
    return apiRequest('/orders', { method: 'POST', body: JSON.stringify(data) });
  },

  /** Reads straight from Supabase (RLS-owned) — orders are created via the
   *  backend (needs the Mongo product/store catalog), but history reads don't. */
  async getMyOrders(): Promise<Order[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('customer_orders')
      .select('*, customer_order_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((o: any) => ({
      id: o.id,
      items: (o.customer_order_items ?? []).map((i: any) => ({
        productName: i.product_name,
        storeName: i.store_name,
        quantity: i.quantity,
        unitPrice: Number(i.unit_price),
      })),
      totalAmount: Number(o.total_amount),
      deliveryAddress: o.delivery_address,
      region: o.region,
      paymentMethod: o.payment_method,
      paymentStatus: o.payment_status,
      orderStatus: o.order_status,
      createdAt: o.created_at,
    }));
  },
};
