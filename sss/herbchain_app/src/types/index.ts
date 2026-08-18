export interface Product {
  id: string;
  name: string;
  type: string;
  manufacturer: string;
  batchId: string;
  manufacturingDate: string;
  expiryDate: string;
  netQuantity: string;
  formulation: string;
  status: 'verified' | 'recalled' | 'expired' | 'pending' | 'warning';
  trustScore: number;
  imageUrl?: string;
  ingredients: Ingredient[];
  origin: Origin;
  timeline: TimelineEvent[];
  labResults: LabResult[];
  blockchain: BlockchainRecord;
  sustainability: SustainabilityData;
  safety: SafetyInfo;
  recall?: RecallInfo;
  trustBreakdown: TrustBreakdown;
  quickVerification: QuickVerification;
}

export interface Ingredient {
  id: string;
  commonName: string;
  scientificName: string;
  plantPart: string;
  source: string;
  sourceRegion: string;
  status: 'verified' | 'pending';
  harvestDate: string;
  processing: string;
  quality: string;
  sustainabilityStatus: string;
  about: string;
}

export interface Origin {
  sourceRegion: string;
  district: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface TimelineEvent {
  id: string;
  stage: string;
  location: string;
  date: string;
  status: string;
  icon: string;
  details?: string;
}

export interface LabResult {
  id: string;
  test: string;
  result: string;
  status: 'passed' | 'failed' | 'pending';
  unit?: string;
  referenceRange?: string;
  date: string;
  laboratory: string;
  reportReference: string;
}

export interface BlockchainRecord {
  verified: boolean;
  timestamp: string;
  transactionRef: string;
  transactionId: string;
  blockNumber: string;
  recordHash: string;
  network: string;
}

export interface SustainabilityData {
  score: number;
  responsibleSourcing: number;
  collectionCompliance: number;
  ecologicalRisk: number;
  transport: number;
  documentation: number;
}

export interface SafetyInfo {
  storage: string;
  warnings: string;
  expiry: string;
  usage: string;
  contraindications: string;
}

export interface RecallInfo {
  recallDate: string;
  reason: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  recommendedAction: string;
}

export interface TrustBreakdown {
  sourceVerification: number;
  labVerification: number;
  traceability: number;
  documentation: number;
  sustainability: number;
}

export interface QuickVerification {
  sourceVerified: boolean;
  labVerified: boolean;
  manufacturerVerified: boolean;
  supplyChainVerified: boolean;
  qrVerified: boolean;
  blockchainAvailable: boolean;
}

export interface Alert {
  id: string;
  type: 'recall' | 'expiry' | 'verification' | 'safety' | 'product' | 'security';
  title: string;
  message: string;
  productId?: string;
  productName?: string;
  batchId?: string;
  date: string;
  read: boolean;
}

export type TriState = 'no' | 'yes' | 'undisclosed';
export type PregnancyStatus = 'not_applicable' | 'pregnant' | 'breastfeeding' | 'planning' | 'undisclosed';

/**
 * Wellness data is health information and is treated as separately-consented,
 * optional data — the registration flow can complete without any of it.
 */
export interface WellnessProfile {
  hasAllergies: TriState;
  allergies: string[];
  allergyNotes?: string;
  hasCurrentHealthIssues: TriState;
  currentHealthIssues?: string;
  hasExistingConditions: TriState;
  conditions: string[];
  /** Quick-select category tags — "points" in the UI; the string field below is the free-text paragraph. */
  medicalHistoryTags: string[];
  medicalHistory?: string;
  currentMedicationTags: string[];
  currentMedications?: string;
}

/**
 * The full Health Profile, managed post-registration from Settings. A superset
 * of WellnessProfile — adds fields the AI chatbot and doctor-guidance modules
 * need for suitability/allergy checking that the original registration
 * wellness step didn't collect.
 */
export interface HealthProfile extends WellnessProfile {
  /** Structured ingredient/allergen names, matched against product ingredients. */
  ingredientAllergies: string[];
  previousAdverseReactions?: string;
  pregnancyStatus: PregnancyStatus;
  dietaryPreferences: string[];
  ayurvedicPreferences: string[];
  consentStoreHealthData: boolean;
  consentPersonalizedAlerts: boolean;
  updatedAt?: string;
}

export interface ConsentRecord {
  terms: boolean;
  privacy: boolean;
  storeHealthData: boolean;
  personalizedAlerts: boolean;
  acceptedAt?: string;
}

export interface User {
  id: string;
  /** Unique per-account ID generated on signup, format AYUR-CUST-XXXXXX. Absent for guest sessions. */
  ayurvedicId?: string;
  name: string;
  email: string;
  phone: string;
  language: 'en' | 'ta';
  isGuest: boolean;
  profilePhoto?: string;

  // Identity. Government IDs are held masked in app state — only the last
  // digits are ever rendered, and full values are never written to logs.
  dateOfBirth?: string;
  aadhaarLast4?: string;
  panLast4?: string;
  occupation?: string;
  religion?: string;

  // Location
  region?: string;
  address?: string;
  coordinates?: { latitude: number; longitude: number };

  wellness?: WellnessProfile;
  consent?: ConsentRecord;
  profileCompletion?: number;
}

export interface ScanHistoryItem {
  id: string;
  productId: string;
  productName: string;
  manufacturer: string;
  batchId: string;
  scanDate: string;
  trustScore: number;
  status: Product['status'];
  statusUpdated?: boolean;
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  productCard?: Product;
}
