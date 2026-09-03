/** Option sets and reference ranges for the laboratory check-in and test forms. */

export const DRYING_METHODS = ['Sun Drying', 'Shade Drying', 'Oven Drying', 'Spray Drying', 'Freeze Drying'];
export const GRINDING_METHODS = ['Ball Mill', 'Hammer Mill', 'Pin Mill', 'Roller Mill', 'Hand Grinding'];
export const SIEVE_SIZES = ['#40', '#60', '#80', '#100', '#120', 'Not sieved'];

export const TRANSPORT_MODES = ['Road — Open truck', 'Road — Closed container', 'Road — Refrigerated', 'Rail', 'Air', 'Hand delivery'];
export const PACKAGING_TYPES = ['Jute sack', 'HDPE bag', 'Food-grade drum', 'Corrugated box', 'Vacuum pack', 'Loose'];
export const PACKAGING_CONDITIONS = ['Intact', 'Minor damage', 'Torn / punctured', 'Wet / stained', 'Severely damaged'];
export const ARRIVAL_CONDITIONS = ['Good — as expected', 'Slight discolouration', 'Visible moisture', 'Wilted / degraded', 'Poor'];

export const CHECK_IN_DOCUMENTS = [
  'Collection certificate',
  'Transport invoice',
  'Weighbridge slip',
  'Forest / harvest permit',
  'Organic certification',
  'Previous lab report',
];

export const CHECK_IN_DECISIONS = ['Accepted', 'Accepted with remarks', 'Quarantined'] as const;
export const YES_NO = ['Yes', 'No'] as const;
export const TAMPER_OPTIONS = ['None', 'Suspected', 'Confirmed'] as const;
export const COLD_CHAIN_OPTIONS = ['Not required', 'Yes', 'No'] as const;
export const OVERALL_RESULTS = ['Pass', 'Conditional Pass', 'Fail'] as const;

/**
 * Indicative Ayurvedic Pharmacopoeia limits, shown beside each field so the
 * analyst can see the acceptance criterion while entering a value. Advisory
 * only — the analyst's own result selection is what the record carries.
 */
export const LIMITS = {
  moisture: '≤ 10%',
  totalAsh: '≤ 5%',
  acidInsolubleAsh: '≤ 1%',
  waterSolubleExtractive: '≥ 10%',
  alcoholSolubleExtractive: '≥ 5%',
  foreignMatterPercent: '≤ 2%',
  lead: '≤ 10 ppm',
  cadmium: '≤ 0.3 ppm',
  arsenic: '≤ 3 ppm',
  mercury: '≤ 1 ppm',
  aflatoxin: '≤ 0.5 ppb',
  totalPlateCount: '≤ 10⁵ cfu/g',
  yeastMould: '≤ 10³ cfu/g',
} as const;
