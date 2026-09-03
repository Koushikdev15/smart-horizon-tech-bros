/** Option sets for the manufacturer goods-inward and product-creation forms. */

export const YES_NO = ['Yes', 'No'] as const;
export const TAMPER = ['None', 'Suspected', 'Confirmed'] as const;
export const TRANSPORT_MODES = ['Road — closed truck', 'Road — open truck', 'Rail', 'Air', 'Courier'] as const;
export const PACKAGING_CONDITION = ['Intact', 'Minor damage', 'Torn / punctured', 'Wet / stained'] as const;
export const VISUAL_CONDITION = ['Excellent', 'Good', 'Acceptable', 'Poor'] as const;
export const CHECKIN_DECISIONS = ['Accepted', 'Accepted with remarks', 'Quarantined'] as const;

export const PRODUCT_CATEGORIES = [
  'Tablet', 'Capsule', 'Syrup', 'Powder / Churna', 'Oil / Taila',
  'Cream', 'Kwatha', 'Asava', 'Arishta', 'Bhasma', 'Lehya', 'Ghrita',
] as const;

export const PACKAGING_TYPES = [
  'Blister Pack', 'HDPE Bottle', 'Glass Bottle', 'Sachet', 'Jar', 'Tube', 'Pouch', 'Carton',
] as const;

export const FORMULATIONS = [
  'Single-herb (Ekamoolika)', 'Classical polyherbal', 'Proprietary polyherbal', 'Herbo-mineral',
] as const;

export const QC_RESULTS = ['Pass', 'Fail', 'Pending'] as const;

/**
 * Indicative acceptance limits at goods-inward. These mirror the laboratory's
 * pharmacopoeial limits so a discrepancy between the certificate and what
 * actually arrived is caught before the material enters production.
 */
export const CHECKIN_LIMITS = {
  /** Weight variance beyond this fraction is flagged for reconciliation. */
  weightVariancePercent: 5,
  /** Moisture re-checked on arrival; above this the batch is held. */
  moisturePercent: 10,
} as const;
