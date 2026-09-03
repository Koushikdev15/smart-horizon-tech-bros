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
 * Parses a stored money value.
 *
 * MRP is free text on the product form, and is in practice saved with the
 * currency symbol attached — "₹450" rather than 450. `Number("₹450")` is NaN,
 * which silently blanked the price on every card, so strip anything that is not
 * part of the number first.
 */
function parseMoney(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const n = Number(String(value).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

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
    mrp: parseMoney(payload.mrp),
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

  /**
   * The full chain of custody for one product: the product itself, plus a lane
   * per constituent batch covering the life it led before the merge.
   *
   * Mirrors what the web portal's verification page shows, so a customer sees
   * the same provenance in the app without being sent to a browser.
   */
  async getTrace(productCode: string): Promise<ProductTrace | null> {
    const { data, error } = await supabase
      .from('products')
      .select('id, payload')
      .ilike('product_code', productCode);
    if (error) throw error;

    const row = (data ?? [])[0] as any;
    if (!row) return null;

    const product = toTraced(row.payload);
    const ids: string[] = (row.payload.components ?? [])
      .map((c: any) => c.batchId)
      .filter(Boolean);

    let batches: any[] = [];
    if (ids.length) {
      const { data: bRows, error: bErr } = await supabase
        .from('batches')
        .select('id, payload')
        .in('id', ids);
      if (bErr) throw bErr;
      batches = (bRows ?? []).map((r: any) => ({ ...r.payload, id: r.id }));
    }

    const lanes: TraceLane[] = (row.payload.components ?? []).map((c: any) => {
      const b = batches.find((x) => x.id === c.batchId);
      return {
        batchNumber: c.batchNumber,
        species: c.species,
        botanicalName: c.botanicalName,
        quantityUsed: `${c.quantityUsed} ${c.unit}`,
        stages: b ? buildLaneStages(b, c) : fallbackStages(c),
      };
    });

    const dist = row.payload.distribution;
    const trunk: TraceStage[] = [
      {
        key: 'manufacturing',
        label: 'Manufacturing',
        icon: 'business-outline',
        actor: row.payload.producedBy,
        organisation: row.payload.manufacturerName,
        date: onDay(row.payload.manufacturingDate),
        facts: [
          row.payload.formulation && { label: 'Formulation', value: row.payload.formulation },
          row.payload.batchSize && { label: 'Batch size', value: row.payload.batchSize },
          row.payload.unitsProduced && { label: 'Units', value: row.payload.unitsProduced },
        ].filter(Boolean) as TraceFact[],
        state: 'done',
      },
      {
        key: 'release',
        label: 'Quality Release',
        icon: 'shield-checkmark-outline',
        actor: row.payload.qcApprovedBy,
        organisation: row.payload.manufacturerName,
        date: onDay(row.payload.createdAt),
        facts: [
          row.payload.finalMoisture && { label: 'Moisture', value: `${row.payload.finalMoisture}%` },
          row.payload.finalAssay && { label: 'Assay', value: row.payload.finalAssay },
          row.payload.microbialClearance && { label: 'Microbial', value: row.payload.microbialClearance },
        ].filter(Boolean) as TraceFact[],
        state: row.payload.status === 'Released' ? 'done' : 'pending',
      },
      {
        key: 'packed',
        label: 'Packed & Coded',
        icon: 'cube-outline',
        organisation: row.payload.manufacturerName,
        date: onDay(row.payload.manufacturingDate),
        facts: [
          row.payload.packagingType && { label: 'Pack', value: row.payload.packagingType },
          row.payload.packSize && { label: 'Size', value: row.payload.packSize },
          { label: 'Code', value: row.payload.productCode },
        ].filter(Boolean) as TraceFact[],
        state: 'done',
      },
      {
        key: 'distribution',
        label: dist?.deliveryStatus === 'Delivered' ? 'Delivered' : 'Distribution',
        icon: 'car-outline',
        actor: dist?.handledBy,
        organisation: dist?.transporter ?? dist?.warehouse,
        date: onDay(dist?.dispatchDate),
        location: dist?.destination,
        facts: [
          dist?.deliveryStatus && { label: 'Status', value: dist.deliveryStatus },
          dist?.vehicleNumber && { label: 'Vehicle', value: dist.vehicleNumber },
        ].filter(Boolean) as TraceFact[],
        state: dist?.deliveryStatus === 'Delivered' ? 'done' : dist ? 'active' : 'pending',
      },
    ];

    return { product, lanes, trunk };
  },
};

/* ── Trace shapes ─────────────────────────────────────────────────────────── */

export interface TraceFact {
  label: string;
  value: string;
}

export interface TraceStage {
  key: string;
  label: string;
  icon: string;
  actor?: string;
  organisation?: string;
  date?: string;
  location?: string;
  facts: TraceFact[];
  certificate?: string;
  state: 'done' | 'active' | 'pending';
}

export interface TraceLane {
  batchNumber: string;
  species: string;
  botanicalName?: string;
  quantityUsed: string;
  stages: TraceStage[];
}

export interface ProductTrace {
  product: TracedProduct;
  lanes: TraceLane[];
  trunk: TraceStage[];
}

/** Date only — a harvest has no meaningful time of day. */
function onDay(value?: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * The three steps a batch goes through on its own, before batches are combined.
 *
 * Built in fixed order from the batch record rather than by replaying its
 * `timeline` array, which is stored newest-first and padded with placeholder
 * entries for stages not yet reached.
 */
function buildLaneStages(b: any, c: any): TraceStage[] {
  const report = b.labReport;
  const checkIn = b.labCheckIn;
  const collectionEvent = (b.timeline ?? []).find(
    (e: any) => e.stage === 'Collection' && e.status !== 'Pending' && e.timestamp,
  );

  return [
    {
      key: 'harvest',
      label: b.collectorType === 'Wild Collector' ? 'Wild Collection' : 'Farm Harvest',
      icon: b.collectorType === 'Wild Collector' ? 'leaf-outline' : 'flower-outline',
      actor: b.collectorName,
      organisation: b.collectorType ?? 'Collector',
      date: onDay(b.harvestDate),
      location: b.region,
      facts: [
        { label: 'Quantity', value: `${b.quantity} ${b.unit}` },
        b.estimatedGrade && { label: 'Grade', value: b.estimatedGrade },
      ].filter(Boolean) as TraceFact[],
      state: 'done',
    },
    {
      key: 'collection',
      label: 'Collection Centre',
      icon: 'home-outline',
      actor: collectionEvent?.user,
      organisation: b.collectionCenter,
      date: onDay(collectionEvent?.timestamp),
      location: b.region,
      facts: [
        b.moisture != null && { label: 'Moisture', value: `${b.moisture}%` },
      ].filter(Boolean) as TraceFact[],
      state: 'done',
    },
    {
      key: 'laboratory',
      label: 'Processing & Laboratory',
      icon: 'flask-outline',
      actor: report?.analyst ?? checkIn?.receivedBy,
      organisation: report?.labName ?? checkIn?.labName,
      date: onDay(report?.testDate ?? checkIn?.receivedAt),
      location: checkIn?.storageLocation,
      facts: [
        report?.moisture && { label: 'Moisture', value: `${report.moisture}%` },
        report?.dnaAuthentication && { label: 'DNA', value: report.dnaAuthentication },
        report?.overallResult && { label: 'Result', value: report.overallResult },
      ].filter(Boolean) as TraceFact[],
      certificate: report?.certificateNumber ?? b.labCertificate ?? c.labCertificate,
      state: report ? 'done' : checkIn ? 'active' : 'pending',
    },
  ];
}

/** When the batch row could not be loaded, show what the product recorded. */
function fallbackStages(c: any): TraceStage[] {
  return [
    {
      key: 'harvest',
      label: c.collectorType === 'Wild Collector' ? 'Wild Collection' : 'Farm Harvest',
      icon: 'flower-outline',
      actor: c.collectorName,
      organisation: c.collectorType ?? 'Collector',
      date: onDay(c.harvestDate),
      location: c.region,
      facts: [{ label: 'Quantity used', value: `${c.quantityUsed} ${c.unit}` }],
      state: 'done',
    },
    {
      key: 'collection',
      label: 'Collection Centre',
      icon: 'home-outline',
      organisation: c.collectionCenter,
      facts: [],
      state: 'done',
    },
  ];
}
