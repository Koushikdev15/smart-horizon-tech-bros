import { Store, IStore } from '../models/Store';
import { ProductInventory } from '../models/ProductInventory';

/**
 * Open/closed is derived from a simple daily HH:MM window compared against
 * the server's local wall-clock time — no per-store timezone modeling. Good
 * enough for "is it open right now" in a single-country deployment; would
 * need a real timezone field to be correct across regions.
 */
export function isStoreOpenNow(store: { is24Hours?: boolean; openTime?: string; closeTime?: string }): boolean | null {
  if (store.is24Hours) return true;
  if (!store.openTime || !store.closeTime) return null;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = store.openTime.split(':').map(Number);
  const [ch, cm] = store.closeTime.split(':').map(Number);
  const openMinutes = oh * 60 + om;
  const closeMinutes = ch * 60 + cm;

  if (openMinutes <= closeMinutes) {
    return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
  }
  // Overnight window, e.g. 20:00–02:00.
  return nowMinutes >= openMinutes || nowMinutes < closeMinutes;
}

async function findOwnStoreOr404(ownerId: string) {
  const store = await Store.findOne({ ownerId });
  if (!store) {
    throw { status: 404, message: 'No store found for this account. Create one first.', isOperational: true };
  }
  return store;
}

export class StoreService {
  async create(ownerId: string, data: any) {
    const existing = await Store.findOne({ ownerId });
    if (existing) {
      throw { status: 400, message: 'You already have a store. Use PUT /stores/me to update it.', isOperational: true };
    }
    return Store.create({
      ownerId,
      name: data.name,
      storeType: data.storeType,
      address: data.address,
      region: data.region,
      state: data.state,
      country: data.country,
      location: { type: 'Point', coordinates: [data.longitude, data.latitude] },
      phone: data.phone,
      openTime: data.openTime,
      closeTime: data.closeTime,
      is24Hours: data.is24Hours,
    });
  }

  async getOwn(ownerId: string) {
    return Store.findOne({ ownerId });
  }

  async update(ownerId: string, data: any) {
    const store = await findOwnStoreOr404(ownerId);
    store.set({
      name: data.name ?? store.name,
      storeType: data.storeType ?? store.storeType,
      address: data.address ?? store.address,
      region: data.region ?? store.region,
      state: data.state ?? store.state,
      country: data.country ?? store.country,
      phone: data.phone ?? store.phone,
      openTime: data.openTime ?? store.openTime,
      closeTime: data.closeTime ?? store.closeTime,
      is24Hours: data.is24Hours ?? store.is24Hours,
    });
    if (data.latitude !== undefined && data.longitude !== undefined) {
      store.location = { type: 'Point', coordinates: [data.longitude, data.latitude] };
    }
    return store.save();
  }

  async upsertInventory(ownerId: string, data: { productId: string; available: boolean; quantity?: number; price?: number }) {
    const store = await findOwnStoreOr404(ownerId);
    return ProductInventory.findOneAndUpdate(
      { storeId: store._id, productId: data.productId },
      { $set: { available: data.available, quantity: data.quantity, price: data.price } },
      { upsert: true, new: true, runValidators: true }
    );
  }

  async getOwnInventory(ownerId: string) {
    const store = await findOwnStoreOr404(ownerId);
    return ProductInventory.find({ storeId: store._id }).populate('productId', 'productName');
  }

  /**
   * Individual store offers for one product — the cart needs a concrete
   * storeId + price to order against, which the aggregate region-availability
   * summary in ProductService.browseForPurchase() deliberately doesn't expose.
   */
  async listOffers(productId: string, region?: string) {
    const storeQuery: Record<string, unknown> = { isActive: true };
    if (region) storeQuery.region = new RegExp(`^${region}$`, 'i');
    const stores = await Store.find(storeQuery);
    const storeById = new Map(stores.map((s) => [String(s._id), s]));

    const inventory = await ProductInventory.find({
      productId,
      available: true,
      storeId: { $in: stores.map((s) => s._id) },
    });

    return inventory
      .map((inv) => {
        const store = storeById.get(String(inv.storeId));
        if (!store) return null;
        return {
          storeId: String(store._id),
          storeName: store.name,
          region: store.region,
          address: store.address,
          isOpenNow: isStoreOpenNow(store),
          price: inv.price,
          quantity: inv.quantity,
        };
      })
      .filter((offer): offer is NonNullable<typeof offer> => offer !== null)
      .sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  }

  /**
   * Only returns ACTIVE stores; when productId is given, only stores that
   * carry that product with available:true (spec §19 — "Only show inventory
   * marked as available").
   */
  async findNearby(params: { latitude: number; longitude: number; maxDistanceKm?: number; productId?: string }) {
    const maxDistanceMeters = (params.maxDistanceKm ?? 25) * 1000;

    const stores = await Store.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [params.longitude, params.latitude] },
          distanceField: 'distanceMeters',
          maxDistance: maxDistanceMeters,
          spherical: true,
          query: { isActive: true },
        },
      },
      { $limit: 50 },
    ]);

    let inventoryByStoreId = new Map<string, { available: boolean; quantity?: number; price?: number }>();
    if (params.productId) {
      const inventory = await ProductInventory.find({ productId: params.productId, available: true });
      inventoryByStoreId = new Map(inventory.map((i) => [String(i.storeId), { available: i.available, quantity: i.quantity, price: i.price }]));
    }

    // Distinct in-stock product count per store — shown on the home-page
    // nearby-stores map, independent of any single-product filter above.
    const storeIds = stores.map((s) => s._id);
    const stockCounts = await ProductInventory.aggregate([
      { $match: { storeId: { $in: storeIds }, available: true, quantity: { $gt: 0 } } },
      { $group: { _id: '$storeId', count: { $sum: 1 } } },
    ]);
    const stockCountByStoreId = new Map(stockCounts.map((c) => [String(c._id), c.count as number]));

    return stores
      .filter((s) => !params.productId || inventoryByStoreId.has(String(s._id)))
      .map((s: IStore & { distanceMeters: number; _id: any }) => ({
        _id: s._id,
        name: s.name,
        storeType: s.storeType,
        address: s.address,
        region: s.region,
        phone: s.phone,
        distanceKm: Math.round((s.distanceMeters / 1000) * 10) / 10,
        isOpenNow: isStoreOpenNow(s),
        coordinates: { latitude: s.location.coordinates[1], longitude: s.location.coordinates[0] },
        inventory: params.productId ? inventoryByStoreId.get(String(s._id)) : undefined,
        stockCount: stockCountByStoreId.get(String(s._id)) ?? 0,
      }));
  }
}
