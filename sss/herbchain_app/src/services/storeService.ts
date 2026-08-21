import { apiRequest } from '@/lib/api';

export interface NearbyStore {
  _id: string;
  name: string;
  storeType: string;
  address: string;
  region: string;
  phone?: string;
  distanceKm: number;
  isOpenNow: boolean | null;
  coordinates: { latitude: number; longitude: number };
  inventory?: { available: boolean; quantity?: number; price?: number };
  stockCount: number;
}

export const storeService = {
  async findNearby(params: {
    latitude: number;
    longitude: number;
    maxDistanceKm?: number;
    productId?: string;
  }): Promise<NearbyStore[]> {
    const query = new URLSearchParams({
      latitude: String(params.latitude),
      longitude: String(params.longitude),
      ...(params.maxDistanceKm ? { maxDistanceKm: String(params.maxDistanceKm) } : {}),
      ...(params.productId ? { productId: params.productId } : {}),
    });
    return apiRequest(`/stores/nearby?${query.toString()}`);
  },
};
