export type UserRole = 'Collection Center' | 'Farmer' | 'Wild Collector' | 'Processing & Laboratory' | 'Manufacturer' | 'Supply Chain' | 'Government';

export interface User {
  id: string;
  name: string;
  email: string;
  ayurvedicId?: string;
  mobile?: string;
  organizationName?: string;
  role: UserRole;
  region?: string;
  status?: 'Active' | 'Suspended' | 'Disabled';
}

export interface Collection {
  id: string;
  species: string;
  botanicalName?: string;
  quantity: number;
  unit: string;
  location: { lat: number; lng: number };
  region?: string;
  status: string;
  collectorName: string;
  collectorType?: 'Farmer' | 'Wild Collector';
  date: string;
  harvestTime?: string;
  harvestMethod?: string;
  moisture?: number;
  storageCondition?: string;
  qualityObservations?: string;
  estimatedGrade?: string;
  sustainabilityNotes?: string;
  photos?: string[];
  gpsLocation?: string;
}

export interface BatchTimelineEvent {
  stage: 'Collection' | 'Processing' | 'Laboratory' | 'Manufacturing' | 'Supply Chain' | 'Consumer Verification';
  timestamp: string;
  organization: string;
  user: string;
  status: 'Completed' | 'In Progress' | 'Pending' | 'Rejected';
  remarks?: string;
  documents?: string[];
  blockchainTxId?: string;
}

export interface Batch {
  id: string;
  batchNumber: string;
  species: string;
  botanicalName?: string;
  quantity: number;
  unit: string;
  collectionCenter: string;
  collectorName: string;
  collectorType?: 'Farmer' | 'Wild Collector';
  harvestDate: string;
  region: string;
  gpsLocation?: string;
  status: 'Collection' | 'Processing' | 'Manufacturing' | 'Supply Chain' | 'Completed' | 'Rejected';
  currentStage: string;
  timeline: BatchTimelineEvent[];
  aiSummary?: string;
  estimatedGrade?: string;
  rating?: number;
  paymentStatus?: 'Pending' | 'Partial' | 'Completed';
  qrCode?: string;
  blockchainHash?: string;
  // Processing fields
  labCheckIn?: LabCheckIn;
  labReport?: LabReport;
  /** Goods-inward record raised when the batch reaches the manufacturing unit. */
  manufacturerCheckIn?: ManufacturerCheckIn;
  /** Product codes this batch has been consumed into. A batch may feed several. */
  usedInProducts?: string[];
  labCertificate?: string;
  heavyMetals?: string;
  pesticides?: string;
  dnaAuthentication?: string;
  moisture?: number;
  // Manufacturing fields
  productName?: string;
  productCategory?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  packagingType?: string;
  // Supply Chain fields
  warehouse?: string;
  dispatchDate?: string;
  vehicleNumber?: string;
  destination?: string;
  expectedDelivery?: string;
  deliveryStatus?: string;
}

/**
 * Goods-inward record raised when a batch physically arrives at the laboratory.
 * Processing is blocked until this exists, so a batch can never be tested
 * before its condition on arrival has been recorded.
 */
export interface LabCheckIn {
  receivedAt: string;
  receivedBy: string;
  labName?: string;
  // Consignment
  transporter?: string;
  vehicleNumber?: string;
  transportMode?: string;
  transitDuration?: string;
  // Integrity
  sealIntact: 'Yes' | 'No';
  tamperEvidence: 'None' | 'Suspected' | 'Confirmed';
  packagingType?: string;
  packageCount?: string;
  packagingCondition?: string;
  // Quantity reconciliation
  declaredWeight?: string;
  receivedWeight?: string;
  weightVariance?: string;
  // Conditions on arrival
  coldChainMaintained: 'Yes' | 'No' | 'Not required';
  arrivalTemperature?: string;
  arrivalHumidity?: string;
  visualCondition?: string;
  mouldPresent: 'Yes' | 'No';
  pestPresent: 'Yes' | 'No';
  foreignMatterVisible: 'Yes' | 'No';
  odourOnArrival?: string;
  // Chain of custody
  documentsReceived: string[];
  sampleDrawn: 'Yes' | 'No';
  sampleQuantity?: string;
  sampleId?: string;
  storageLocation?: string;
  discrepancyNotes?: string;
  decision: 'Accepted' | 'Accepted with remarks' | 'Quarantined';
  aiSummary?: string;
}

/** Full analytical record produced by the laboratory during processing. */
export interface LabReport {
  // Processing
  cleaningCompleted?: boolean;
  dryingMethod?: string;
  grindingMethod?: string;
  sieveSize?: string;
  temperature?: string;
  humidity?: string;
  moisture?: string;
  storageCondition?: string;
  outputQuantity?: string;
  yieldPercent?: string;
  // Identity
  macroscopy?: string;
  microscopy?: string;
  tlcProfile?: string;
  dnaAuthentication?: string;
  // Pharmacopoeial
  totalAsh?: string;
  acidInsolubleAsh?: string;
  waterSolubleExtractive?: string;
  alcoholSolubleExtractive?: string;
  foreignMatterPercent?: string;
  volatileOil?: string;
  // Assay
  markerCompound?: string;
  markerContent?: string;
  // Contaminants (ppm)
  lead?: string;
  cadmium?: string;
  arsenic?: string;
  mercury?: string;
  pesticides?: string;
  aflatoxin?: string;
  // Microbiology
  totalPlateCount?: string;
  yeastMould?: string;
  eColi?: string;
  salmonella?: string;
  // Sensory
  visualInspection?: string;
  odour?: string;
  colour?: string;
  texture?: string;
  // Sign-off
  labName?: string;
  nablNumber?: string;
  analyst?: string;
  approvedBy?: string;
  testDate?: string;
  certificateNumber?: string;
  overallResult?: 'Pass' | 'Fail' | 'Conditional Pass';
  remarks?: string;
  aiSummary?: string;
}

/**
 * Goods-inward record raised when a certified batch arrives at the
 * manufacturing unit from the laboratory.
 *
 * Manufacturing is blocked until this exists: a batch can never be formulated
 * into a consumer product before its certificate has been verified and its
 * condition on arrival recorded.
 */
export interface ManufacturerCheckIn {
  receivedAt: string;
  receivedBy: string;
  facilityName?: string;
  // Inbound consignment
  transporter?: string;
  vehicleNumber?: string;
  transportMode?: string;
  transitDuration?: string;
  // Certificate verification — the key control at this stage
  coaReceived: 'Yes' | 'No';
  coaNumber?: string;
  coaMatchesBatch: 'Yes' | 'No';
  coaWithinValidity: 'Yes' | 'No';
  labResultReviewed: 'Yes' | 'No';
  // Consignment integrity
  sealIntact: 'Yes' | 'No';
  tamperEvidence: 'None' | 'Suspected' | 'Confirmed';
  packagingCondition?: string;
  containerCount?: string;
  // Quantity reconciliation
  declaredWeight?: string;
  receivedWeight?: string;
  weightVariance?: string;
  // Condition on arrival
  visualCondition?: string;
  colourAcceptable: 'Yes' | 'No';
  odourAcceptable: 'Yes' | 'No';
  mouldPresent: 'Yes' | 'No';
  pestPresent: 'Yes' | 'No';
  foreignMatterVisible: 'Yes' | 'No';
  moistureOnArrival?: string;
  storageTemperature?: string;
  storageHumidity?: string;
  // In-house QA
  retestRequired: 'Yes' | 'No';
  sampleDrawn: 'Yes' | 'No';
  sampleId?: string;
  sampleQuantity?: string;
  // Compliance and storage
  gmpAreaVerified: 'Yes' | 'No';
  storageLocation?: string;
  shelfLifeRemaining?: string;
  discrepancyNotes?: string;
  decision: 'Accepted' | 'Accepted with remarks' | 'Quarantined';
  aiSummary?: string;
}

/** One batch's contribution to a finished product. */
export interface ProductComponent {
  batchId: string;
  batchNumber: string;
  species: string;
  botanicalName?: string;
  quantityUsed: number;
  unit: string;
  collectionCenter: string;
  collectorName: string;
  collectorType?: 'Farmer' | 'Wild Collector';
  region: string;
  harvestDate: string;
  labCertificate?: string;
}

/** Dispatch record raised when Supply Chain takes a released product on. */
export interface ProductDistribution {
  warehouse?: string;
  transporter?: string;
  vehicleNumber?: string;
  destination?: string;
  dispatchDate?: string;
  expectedDelivery?: string;
  deliveryStatus: 'Ready for Dispatch' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Delayed';
  unitsDispatched?: string;
  temperature?: string;
  handledBy?: string;
  remarks?: string;
  updatedAt: string;
}

/**
 * A finished consumer product, formulated from one or more checked-in batches.
 *
 * The QR printed on the pack resolves to `/verify/{productCode}`, which renders
 * the full provenance of every constituent batch — so the chain from collector
 * to shelf stays legible to whoever is holding the box.
 */
export interface Product {
  id: string;
  productCode: string;
  productName: string;
  category: string;
  formulation?: string;
  /** The batches consumed, with the quantity drawn from each. */
  components: ProductComponent[];
  // Manufacturing record
  manufacturingDate: string;
  expiryDate: string;
  shelfLife?: string;
  batchSize?: string;
  unitsProduced?: string;
  packagingType?: string;
  packSize?: string;
  // Licensing and quality
  manufacturerName: string;
  manufacturingLicense?: string;
  gmpCertificate?: string;
  ayushLicense?: string;
  // Product-level QC
  finalMoisture?: string;
  finalAssay?: string;
  microbialClearance?: 'Pass' | 'Fail' | 'Pending';
  stabilityStudy?: string;
  qcApprovedBy?: string;
  producedBy?: string;
  // Consumer-facing label
  dosage?: string;
  indications?: string;
  contraindications?: string;
  storageConditions?: string;
  mrp?: string;
  remarks?: string;
  aiSummary?: string;
  /** Set once Supply Chain takes the product on for delivery. */
  distribution?: ProductDistribution;
  // Provenance
  qrCode: string;
  blockchainHash?: string;
  timeline: BatchTimelineEvent[];
  createdAt: string;
  status: 'Released' | 'Quarantined' | 'Recalled';
}

export interface Member {
  id: string;
  ayurvedicId: string;
  name: string;
  organizationName: string;
  role: UserRole;
  email: string;
  phone: string;
  region?: string;
  address?: string;
  gst?: string;
  pan?: string;
  licenseNumber?: string;
  status: 'Active' | 'Pending' | 'Suspended' | 'Disabled' | 'Rejected';
  registeredDate: string;
  documents?: string[];
  // Role-specific
  warehouseCapacity?: string;
  vehicleDetails?: string;
  nablCertificate?: string;
  drugLicense?: string;
  gmpCertificate?: string;
  manufacturingLicense?: string;
  // Registration payloads captured per role at sign-up (jsonb columns).
  farmerDetails?: FarmerDetails;
  wildCollectorDetails?: WildCollectorDetails;
}

/** Extra fields collected by the Farmer registration form. */
export interface FarmerDetails {
  name?: string;
  aadhar?: string;
  land?: string;
  soil?: string;
  irrigation?: string;
  herbs?: string;
  cert?: string;
  address?: string;
  bank?: string;
  phone?: string;
  email?: string;
}

/** Extra fields collected by the Wild Collector registration form. */
export interface WildCollectorDetails {
  name?: string;
  aadhar?: string;
  zone?: string;
  permit?: string;
  tribe?: string;
  herbs?: string;
  exp?: string;
  address?: string;
  bank?: string;
  phone?: string;
  email?: string;
}

export interface Complaint {
  id: string;
  batchId: string;
  type: 'Quality' | 'Delivery' | 'Fraud' | 'Compliance' | 'Other';
  source: 'Collection Center' | 'Processing' | 'Manufacturer' | 'Supply Chain' | 'Consumer';
  description: string;
  status: 'Open' | 'Under Review' | 'Resolved' | 'Closed';
  assignedOfficer?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface Payment {
  id: string;
  batchId: string;
  stage: 'Collection' | 'Processing' | 'Manufacturing' | 'Supply Chain';
  amount: number;
  currency: string;
  status: 'Pending' | 'Released' | 'On Hold' | 'Failed';
  recipient: string;
  recipientRole: UserRole;
  releasedAt?: string;
  createdAt: string;
  blockchainTxId?: string;
  remarks?: string;
}

export interface Message {
  id: string;
  batchId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  timestamp: string;
  attachments?: string[];
  isRead: boolean;
}

export interface MessageThread {
  batchId: string;
  batchSpecies: string;
  messages: Message[];
  participants: string[];
  isReadOnly: boolean;
  lastMessage?: Message;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  timestamp: string;
  batchId?: string;
}

export interface Farmer {
  id: string;
  farmerId: string;
  name: string;
  village: string;
  region: string;
  phone: string;
  status: 'Active' | 'Inactive';
  totalCollections: number;
  lastCollection?: string;
  rating?: number;
  bankDetails?: string;
}

export interface WildCollector {
  id: string;
  collectorId: string;
  name: string;
  village: string;
  region: string;
  phone: string;
  status: 'Active' | 'Inactive';
  totalCollections: number;
  lastCollection?: string;
  rating?: number;
  forestPermitNo?: string;
}

export interface Report {
  id: string;
  title: string;
  type: 'Compliance' | 'Financial' | 'Quality' | 'Batch Summary' | 'Member Activity';
  period: string;
  generatedAt: string;
  format: 'PDF' | 'CSV' | 'XLSX';
  sizeKb: number;
  status: 'Ready' | 'Generating';
}

export interface AuditLog {
  id: string;
  txHash: string;
  type: string;
  entity: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  status: 'Committed' | 'Pending' | 'Failed';
  blockNumber?: number;
  ipAddress?: string;
}
