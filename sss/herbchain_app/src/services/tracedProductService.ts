import { supabase } from '@/lib/supabase';

/**
 * Traceable products — the finished goods the web portal has released and
 * Supply Chain has marked delivered.
 *
 * These come straight from the shared Supabase `products` table (public SELECT,
 * because the printed QR has to resolve for anyone holding the pack), not from
 * the Express/Mongo catalogue the rest of E-Buy uses. So they carry their full
 * provenance — the batches, growers and regions they were made from — which the
 * Mongo catalogue has no equivalent of.
 *
 * Only *delivered* products appear: anything still in transit has not reached a
 * shelf, so offering it would be misleading.
 */

export interface TracedIngredient {
  name: string;
  scientificName?: string;
  region?: string;
  collectorName?: string;
  batchNumber: string;
}

export interface TracedProduct {
  productCode: string;
  productName: string;
  category: string;
  formulation?: string;
  manufacturerName: string;
  manufacturingDate?: string;
  expiryDate?: string;
  packagingType?: string;
  packSize?: string;
  mrp?: number;
  dosage?: string;
  indications?: string;
  contraindications?: string;
  storageConditions?: string;
  summary?: string;
  ingredients: TracedIngredient[];
  /** Where the pack was sent, once delivered. */
  destination?: string;
  deliveredOn?: string;
  /** Public verification page for this pack. */
  verifyUrl: string;
  /** Health topics inferred from the label, for the category filter. */
  healthTopics: string[];
}

/**
 * Base for the public trace page.
 *
 * Set EXPO_PUBLIC_VERIFY_BASE_URL to wherever the web portal is reachable from
 * the phone — a stored URL is no good, because it was captured on whatever host
 * the product happened to be created on.
 */
const VERIFY_BASE = (process.env.EXPO_PUBLIC_VERIFY_BASE_URL || '').replace(/\/+$/, '');

/**
 * Maps the free-text label onto the health topics E-Buy filters by, so a traced
 * product still responds to the category chips. Keyword match only — nothing is
 * inferred that the label does not actually say.
 */
const TOPIC_KEYWORDS: Record<string, string[]> = {
  Immunity: ['immun', 'resistance', 'antioxidant'],
  Digestion: ['digest', 'gut', 'appetite', 'acidity', 'bowel'],
  'Skin Health': ['skin', 'complexion', 'acne', 'derma'],
  'Hair & Skin': ['hair', 'scalp'],
  'Joint & Muscle Health': ['joint', 'muscle', 'arthrit', 'mobility'],
  'Respiratory Health': ['respirat', 'cough', 'asthma', 'lung', 'breath'],
  Stress: ['stress', 'anxiety', 'calm', 'adaptogen', 'relax'],
  Sleep: ['sleep', 'insomnia', 'rest'],
  Energy: ['energy', 'vitality', 'stamina', 'fatigue'],
  Focus: ['focus', 'concentrat', 'clarity'],
  Memory: ['memory', 'cognit', 'brain', 'nootrop'],
  "Women's Health": ['women', 'menstrual', 'lactation', 'hormone'],
  'Heart Health': ['heart', 'cardio', 'cholesterol', 'blood pressure'],
  Detox: ['detox', 'cleans', 'liver', 'purif'],
  'Pain & Inflammation': ['pain', 'inflamm', 'swelling', 'analges'],
};

function inferTopics(product: any): string[] {
  const haystack = [
    product.indications, product.productName, product.category,
    product.formulation, product.remarks,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return Object.entries(TOPIC_KEYWORDS)
    .filter(([, words]) => words.some((w) => haystack.includes(w)))
    .map(([topic]) => topic);
}

function toTraced(payload: any): TracedProduct {
  const code = payload.productCode;
  const dist = payload.distribution;

  return {
    productCode: code,
    productName: payload.productName,
    category: payload.category,
    formulation: payload.formulation,
    manufacturerName: payload.manufacturerName,
    manufacturingDate: payload.manufacturingDate,
    expiryDate: payload.expiryDate,
    packagingType: payload.packagingType,
    packSize: payload.packSize,
    mrp: payload.mrp != null && payload.mrp !== '' ? Number(payload.mrp) : undefined,
    dosage: payload.dosage,
    indications: payload.indications,
    contraindications: payload.contraindications,
    storageConditions: payload.storageConditions,
    summary: payload.aiSummary,
    ingredients: (payload.components ?? []).map((c: any) => ({
      name: c.species,
      scientificName: c.botanicalName,
      region: c.region,
      collectorName: c.collectorName,
      batchNumber: c.batchNumber,
    })),
    destination: dist?.destination,
    deliveredOn: dist?.dispatchDate,
    // Prefer the configured base; fall back to whatever the pack recorded.
    verifyUrl: VERIFY_BASE ? `${VERIFY_BASE}/verify/${code}` : payload.qrCode ?? '',
    healthTopics: inferTopics(payload),
  };
}

export const tracedProductService = {
  /**
   * Delivered products, newest first.
   *
   * Filtering happens client-side: `distribution` lives inside the jsonb
   * payload and has no generated column to query on, and the catalogue is
   * small enough that fetching it whole is cheaper than adding one.
   */
  async listDelivered(params: { q?: string; healthTopic?: string } = {}): Promise<TracedProduct[]> {
    const { data, error } = await supabase
      .from('products')
      .select('id, payload')
      .order('created_at', { ascending: false });

    if (error) throw error;

    let items = (data ?? [])
      .map((r: any) => r.payload)
      .filter((p: any) => p?.distribution?.deliveryStatus === 'Delivered')
      .filter((p: any) => p.status !== 'Recalled')
      // A pack past its printed expiry should not be offered.
      .filter((p: any) => {
        if (!p.expiryDate) return true;
        const d = new Date(p.expiryDate);
        return Number.isNaN(d.getTime()) || d >= new Date();
      })
      .map(toTraced);

    const q = params.q?.trim().toLowerCase();
    if (q) {
      items = items.filter(
        (p) =>
          p.productName.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.manufacturerName.toLowerCase().includes(q) ||
          p.ingredients.some((i) => i.name.toLowerCase().includes(q)),
      );
    }

    if (params.healthTopic) {
      items = items.filter((p) => p.healthTopics.includes(params.healthTopic!));
    }

    return items;
  },

  async getByCode(productCode: string): Promise<TracedProduct | null> {
    const { data, error } = await supabase
      .from('products')
      .select('id, payload')
      .ilike('product_code', productCode);

    if (error) throw error;
    const row = (data ?? [])[0] as any;
    return row ? toTraced(row.payload) : null;
  },
};
