import { Product, IProduct } from '../models/Product';
import { Store } from '../models/Store';
import { ProductInventory } from '../models/ProductInventory';

export interface RegionAvailability {
  storeCount: number;
  minPrice?: number;
  totalQuantity?: number;
}

export class ProductService {
  async create(manufacturerId: string, data: Partial<IProduct>) {
    return Product.create({ ...data, manufacturerId, batchIds: [] });
  }

  async search(filters: { q?: string; healthTopic?: string; ingredient?: string }) {
    const query: Record<string, unknown> = {};
    if (filters.q) query.$text = { $search: filters.q };
    if (filters.healthTopic) query.healthTopics = new RegExp(filters.healthTopic, 'i');
    if (filters.ingredient) query['ingredients.name'] = new RegExp(filters.ingredient, 'i');
    return Product.find(query).limit(50);
  }

  /**
   * E-Buy browsing: same product search, but when a region is given, each
   * result is annotated with that region's in-stock offer summary (store
   * count / cheapest price) and results with regional availability are
   * sorted ahead of ones without — never a hard filter, since a product with
   * no regional stock is still worth showing (just lower priority).
   */
  async browseForPurchase(filters: { q?: string; healthTopic?: string; region?: string }) {
    const query: Record<string, unknown> = {};
    if (filters.q) query.$text = { $search: filters.q };
    if (filters.healthTopic) query.healthTopics = new RegExp(filters.healthTopic, 'i');

    const products = await Product.find(query).limit(50).lean();
    if (!filters.region) return products.map((p) => ({ ...p, regionAvailability: null as RegionAvailability | null }));

    const stores = await Store.find({ region: new RegExp(`^${filters.region}$`, 'i'), isActive: true });
    const storeIds = stores.map((s) => s._id);

    const inventory = await ProductInventory.find({
      productId: { $in: products.map((p) => p._id) },
      storeId: { $in: storeIds },
      available: true,
    });

    const availabilityByProduct = new Map<string, RegionAvailability>();
    for (const inv of inventory) {
      const key = String(inv.productId);
      const existing = availabilityByProduct.get(key) ?? { storeCount: 0, minPrice: undefined, totalQuantity: 0 };
      existing.storeCount += 1;
      if (inv.price != null) existing.minPrice = existing.minPrice == null ? inv.price : Math.min(existing.minPrice, inv.price);
      existing.totalQuantity = (existing.totalQuantity ?? 0) + (inv.quantity ?? 0);
      availabilityByProduct.set(key, existing);
    }

    const withAvailability = products.map((p) => ({
      ...p,
      regionAvailability: availabilityByProduct.get(String(p._id)) ?? null,
    }));

    withAvailability.sort((a, b) => (b.regionAvailability ? 1 : 0) - (a.regionAvailability ? 1 : 0));
    return withAvailability;
  }

  async getById(id: string) {
    const product = await Product.findById(id);
    if (!product) {
      throw { status: 404, message: 'Product not found', isOperational: true };
    }
    return product;
  }

  async getByQrCode(qrCode: string) {
    const product = await Product.findOne({ qrCode });
    if (!product) {
      throw { status: 404, message: 'No product found for this QR code', isOperational: true };
    }
    return product;
  }

  /** Resolves either a Mongo ObjectId or a product name (case-insensitive, exact match first) to a Product. */
  async resolve(identifier: { productId?: string; productName?: string }) {
    if (identifier.productId) {
      const product = await Product.findById(identifier.productId);
      if (product) return product;
    }
    if (identifier.productName) {
      const exact = await Product.findOne({ productName: new RegExp(`^${identifier.productName}$`, 'i') });
      if (exact) return exact;
      const partial = await Product.findOne({ productName: new RegExp(identifier.productName, 'i') });
      if (partial) return partial;
    }
    throw { status: 404, message: 'Product not found', isOperational: true };
  }
}
