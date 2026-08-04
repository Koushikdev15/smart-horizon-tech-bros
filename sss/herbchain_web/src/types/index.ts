export type UserRole = 'Collection Center' | 'Processing & Laboratory' | 'Manufacturer' | 'Supply Chain' | 'Government';

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
