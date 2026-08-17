import { apiRequest } from '@/lib/api';

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
  _id: string;
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

  async getMyOrders(): Promise<Order[]> {
    return apiRequest('/orders/me');
  },
};
