import type { Batch, Member, Complaint, Payment, Farmer, WildCollector, AuditLog, MessageThread, Report } from '../types';

// ─── MOCK BATCHES ───
export const mockBatches: Batch[] = [
  {
    id: '1', batchNumber: 'BATCH-2026-0047', species: 'Ashwagandha', botanicalName: 'Withania somnifera',
    quantity: 450, unit: 'kg', collectionCenter: 'Western Ghats Collection Center',
    collectorName: 'Rajesh Kumar', collectorType: 'Farmer', harvestDate: '2026-07-10',
    region: 'Kerala', gpsLocation: '10.8505,76.2711',
    status: 'Processing', currentStage: 'Processing & Laboratory',
    estimatedGrade: 'Grade A', rating: 4.5, paymentStatus: 'Partial',
    aiSummary: 'High-quality Ashwagandha batch collected from certified organic farm in Palakkad district. GPS-verified location confirms sustainable harvesting practices. Moisture content within acceptable range (8.2%). Recommended for premium grade processing.',
    blockchainHash: '0x8f3a2b1c9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a',
    timeline: [
      { stage: 'Collection', timestamp: '2026-07-10T08:30:00Z', organization: 'Western Ghats Collection Center', user: 'Rajesh Kumar', status: 'Completed', remarks: 'Fresh harvest from certified organic farm, excellent quality.', blockchainTxId: '0x8f3a...39a1', documents: ['collection_cert.pdf'] },
      { stage: 'Processing', timestamp: '2026-07-12T10:00:00Z', organization: 'Kerala AYUSH Processing Unit', user: 'Dr. Priya Nair', status: 'In Progress', remarks: 'Cleaning and drying in progress.', blockchainTxId: '0x2a4c...bb47' },
      { stage: 'Laboratory', timestamp: '', organization: '', user: '', status: 'Pending' },
      { stage: 'Manufacturing', timestamp: '', organization: '', user: '', status: 'Pending' },
      { stage: 'Supply Chain', timestamp: '', organization: '', user: '', status: 'Pending' },
    ],
  },
  {
    id: '2', batchNumber: 'BATCH-2026-0042', species: 'Brahmi', botanicalName: 'Bacopa monnieri',
    quantity: 220, unit: 'kg', collectionCenter: 'Himalayan Herb Collectors',
    collectorName: 'Sunita Devi', collectorType: 'Wild Collector', harvestDate: '2026-07-05',
    region: 'Uttarakhand', gpsLocation: '30.3165,78.0322',
    status: 'Manufacturing', currentStage: 'Manufacturer',
    estimatedGrade: 'Grade A+', rating: 5, paymentStatus: 'Partial',
    aiSummary: 'Wild-harvested Brahmi from certified forest area in Uttarakhand. Forest permit verified. Exceptional phytochemical profile confirmed by laboratory analysis.',
    blockchainHash: '0x2b4c6d8e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c',
    labCertificate: 'LAB-CERT-2026-0089',
    timeline: [
      { stage: 'Collection', timestamp: '2026-07-05T06:00:00Z', organization: 'Himalayan Herb Collectors', user: 'Sunita Devi', status: 'Completed', remarks: 'Certified wild harvest, forest permit attached.', blockchainTxId: '0x9c2d...ef22' },
      { stage: 'Processing', timestamp: '2026-07-07T09:00:00Z', organization: 'Delhi NABL Lab', user: 'Dr. Amit Sharma', status: 'Completed', remarks: 'Cleaning and drying completed. Grade A+ quality confirmed.', blockchainTxId: '0x1a3b...cd45' },
      { stage: 'Laboratory', timestamp: '2026-07-09T11:00:00Z', organization: 'Delhi NABL Lab', user: 'Dr. Kavita Singh', status: 'Completed', remarks: 'All tests passed. DNA authentic. Certificate issued.', blockchainTxId: '0x4e5f...ab12', documents: ['lab_cert_0089.pdf'] },
      { stage: 'Manufacturing', timestamp: '2026-07-14T09:30:00Z', organization: 'Himalaya Drug Company', user: 'Mr. Rohit Verma', status: 'In Progress', remarks: 'Manufacturing Brahmi capsules, batch size 10,000 units.' },
      { stage: 'Supply Chain', timestamp: '', organization: '', user: '', status: 'Pending' },
    ],
  },
  {
    id: '3', batchNumber: 'BATCH-2026-0038', species: 'Tulsi', botanicalName: 'Ocimum tenuiflorum',
    quantity: 180, unit: 'kg', collectionCenter: 'Maharashtra Collection Hub',
    collectorName: 'Amit Patil', collectorType: 'Farmer', harvestDate: '2026-07-01',
    region: 'Maharashtra', gpsLocation: '19.0760,72.8777',
    status: 'Rejected', currentStage: 'Processing & Laboratory',
    estimatedGrade: 'Rejected', rating: 2, paymentStatus: 'Pending',
    aiSummary: 'Tulsi batch failed heavy metals test. Lead content found above permissible limit.',
    timeline: [
      { stage: 'Collection', timestamp: '2026-07-01T07:00:00Z', organization: 'Maharashtra Collection Hub', user: 'Amit Patil', status: 'Completed', remarks: 'Collection completed.', blockchainTxId: '0x3c5d...7f89' },
      { stage: 'Processing', timestamp: '2026-07-03T10:00:00Z', organization: 'Pune Lab Center', user: 'Dr. Meera Joshi', status: 'Rejected', remarks: 'FAILED: Lead content 4.2 ppm (limit: 2.5 ppm). Batch quarantined.', blockchainTxId: '0x5f7a...bc23' },
    ],
  },
  {
    id: '4', batchNumber: 'BATCH-2026-0033', species: 'Neem', botanicalName: 'Azadirachta indica',
    quantity: 600, unit: 'kg', collectionCenter: 'Rajasthan Herb Center',
    collectorName: 'Vikram Singh', collectorType: 'Farmer', harvestDate: '2026-06-25',
    region: 'Rajasthan', gpsLocation: '27.0238,74.2179',
    status: 'Completed', currentStage: 'Delivered',
    estimatedGrade: 'Grade B+', rating: 4, paymentStatus: 'Completed',
    productName: 'Neem Skin Care Oil',
    productCategory: 'Cosmetics',
    manufacturingDate: '2026-07-08',
    expiryDate: '2028-07-08',
    qrCode: 'BATCH-2026-0033-QR',
    blockchainHash: '0x4d6e8f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e',
    timeline: [
      { stage: 'Collection', timestamp: '2026-06-25T06:00:00Z', organization: 'Rajasthan Herb Center', user: 'Vikram Singh', status: 'Completed', blockchainTxId: '0xab1c...de23' },
      { stage: 'Processing', timestamp: '2026-06-28T10:00:00Z', organization: 'Jaipur Processing Unit', user: 'Dr. Ravi Kumar', status: 'Completed', blockchainTxId: '0xbc2d...ef34' },
      { stage: 'Laboratory', timestamp: '2026-06-30T11:00:00Z', organization: 'Jaipur NABL Lab', user: 'Dr. Pooja Shah', status: 'Completed', blockchainTxId: '0xcd3e...fa45', documents: ['lab_cert_0077.pdf'] },
      { stage: 'Manufacturing', timestamp: '2026-07-08T09:00:00Z', organization: 'AyurNature Products Pvt Ltd', user: 'Mr. Deepak Mehta', status: 'Completed', blockchainTxId: '0xde4f...ab56' },
      { stage: 'Supply Chain', timestamp: '2026-07-12T08:00:00Z', organization: 'IndiaShip Logistics', user: 'Mr. Suresh Yadav', status: 'Completed', remarks: 'Delivered to Mumbai retail chain.', blockchainTxId: '0xef5a...bc67' },
    ],
  },
  {
    id: '5', batchNumber: 'BATCH-2026-0029', species: 'Shatavari', botanicalName: 'Asparagus racemosus',
    quantity: 320, unit: 'kg', collectionCenter: 'Odisha Herb Collective',
    collectorName: 'Biju Patra', collectorType: 'Farmer', harvestDate: '2026-06-18',
    region: 'Odisha', gpsLocation: '20.9517,85.0985',
    status: 'Rejected', currentStage: 'Manufacturer',
    estimatedGrade: 'Rejected', rating: 2.5, paymentStatus: 'Partial',
    aiSummary: 'Batch rejected during manufacturing — GMP audit found capsule fill-weight variance beyond tolerance and a packaging line contamination risk.',
    labCertificate: 'LAB-CERT-2026-0071',
    timeline: [
      { stage: 'Collection', timestamp: '2026-06-18T07:00:00Z', organization: 'Odisha Herb Collective', user: 'Biju Patra', status: 'Completed', blockchainTxId: '0x7a1b...2c3d' },
      { stage: 'Processing', timestamp: '2026-06-20T09:00:00Z', organization: 'Bhubaneswar Processing Unit', user: 'Dr. Nilima Rout', status: 'Completed', blockchainTxId: '0x4d5e...6f7a' },
      { stage: 'Laboratory', timestamp: '2026-06-22T10:00:00Z', organization: 'Bhubaneswar NABL Lab', user: 'Dr. Ashok Behera', status: 'Completed', blockchainTxId: '0x8b9c...0d1e', documents: ['lab_cert_0071.pdf'] },
      { stage: 'Manufacturing', timestamp: '2026-06-27T11:00:00Z', organization: 'Odisha Ayur Manufacturing Ltd', user: 'Mr. Sameer Das', status: 'Rejected', remarks: 'FAILED: GMP audit found capsule fill-weight variance beyond ±5% tolerance. Batch quarantined.', blockchainTxId: '0x2f3a...4b5c' },
    ],
  },
  {
    id: '6', batchNumber: 'BATCH-2026-0025', species: 'Amla', botanicalName: 'Phyllanthus emblica',
    quantity: 500, unit: 'kg', collectionCenter: 'Gujarat Amla Growers Co-op',
    collectorName: 'Kishor Bhai', collectorType: 'Farmer', harvestDate: '2026-06-10',
    region: 'Gujarat', gpsLocation: '22.2587,71.1924',
    status: 'Rejected', currentStage: 'Supply Chain',
    estimatedGrade: 'Rejected', rating: 3, paymentStatus: 'Partial',
    productName: 'Amla Immunity Juice', productCategory: 'Nutraceutical', manufacturingDate: '2026-06-25',
    aiSummary: 'Cold-chain temperature excursion detected during transit — shipment quarantined by logistics partner pending re-verification.',
    timeline: [
      { stage: 'Collection', timestamp: '2026-06-10T06:30:00Z', organization: 'Gujarat Amla Growers Co-op', user: 'Kishor Bhai', status: 'Completed', blockchainTxId: '0x1c2d...3e4f' },
      { stage: 'Processing', timestamp: '2026-06-13T09:00:00Z', organization: 'Ahmedabad Processing Center', user: 'Dr. Falguni Shah', status: 'Completed', blockchainTxId: '0x5a6b...7c8d' },
      { stage: 'Laboratory', timestamp: '2026-06-15T10:00:00Z', organization: 'Ahmedabad NABL Lab', user: 'Dr. Hemal Trivedi', status: 'Completed', blockchainTxId: '0x9e0f...1a2b', documents: ['lab_cert_0065.pdf'] },
      { stage: 'Manufacturing', timestamp: '2026-06-25T09:30:00Z', organization: 'Gujarat Nutraceuticals Pvt Ltd', user: 'Ms. Priyal Desai', status: 'Completed', blockchainTxId: '0x3c4d...5e6f' },
      { stage: 'Supply Chain', timestamp: '2026-06-28T08:00:00Z', organization: 'WestZone Cold Chain Logistics', user: 'Mr. Jignesh Patel', status: 'Rejected', remarks: 'FAILED: Refrigerated truck temperature exceeded 8°C for 6+ hours during transit. Shipment quarantined at Ahmedabad depot.', blockchainTxId: '0x7f8a...9b0c' },
    ],
  },
  {
    id: '7', batchNumber: 'BATCH-2026-0020', species: 'Giloy', botanicalName: 'Tinospora cordifolia',
    quantity: 275, unit: 'kg', collectionCenter: 'Madhya Pradesh Forest Collective',
    collectorName: 'Ramesh Chandra', collectorType: 'Wild Collector', harvestDate: '2026-06-01',
    region: 'Madhya Pradesh', gpsLocation: '23.2599,77.4126',
    status: 'Completed', currentStage: 'Delivered',
    estimatedGrade: 'Grade A', rating: 4.6, paymentStatus: 'Completed',
    productName: 'Giloy Immunity Tablets', productCategory: 'Tablet',
    manufacturingDate: '2026-06-20', expiryDate: '2028-06-20',
    qrCode: 'BATCH-2026-0020-QR', blockchainHash: '0x6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f',
    labCertificate: 'LAB-CERT-2026-0058',
    timeline: [
      { stage: 'Collection', timestamp: '2026-06-01T06:00:00Z', organization: 'Madhya Pradesh Forest Collective', user: 'Ramesh Chandra', status: 'Completed', blockchainTxId: '0x1a2b...3c4d' },
      { stage: 'Processing', timestamp: '2026-06-04T09:00:00Z', organization: 'Bhopal Processing Unit', user: 'Dr. Anjali Verma', status: 'Completed', blockchainTxId: '0x5e6f...7a8b' },
      { stage: 'Laboratory', timestamp: '2026-06-06T10:00:00Z', organization: 'Bhopal NABL Lab', user: 'Dr. Vinod Chouhan', status: 'Completed', blockchainTxId: '0x9c0d...1e2f', documents: ['lab_cert_0058.pdf'] },
      { stage: 'Manufacturing', timestamp: '2026-06-20T09:00:00Z', organization: 'Central India Ayurveda Ltd', user: 'Mr. Nikhil Sharma', status: 'Completed', blockchainTxId: '0x3a4b...5c6d' },
      { stage: 'Supply Chain', timestamp: '2026-06-24T08:00:00Z', organization: 'MP State Logistics', user: 'Mr. Arvind Tiwari', status: 'Completed', remarks: 'Delivered to Bhopal retail chain.', blockchainTxId: '0x7e8f...9a0b' },
    ],
  },
];

// ─── MOCK MEMBERS ───
export const mockMembers: Member[] = [
  { id: 'm1', ayurvedicId: 'AYU-CC-001', name: 'Rajan Pillai', organizationName: 'Western Ghats Collection Center', role: 'Collection Center', email: 'rajan@wghc.com', phone: '+91 9876543210', region: 'Kerala', address: 'Palakkad, Kerala - 678001', gst: '32ABCDE1234F1Z5', pan: 'ABCDE1234F', licenseNumber: 'KL-CC-2024-0012', status: 'Active', registeredDate: '2024-03-15', warehouseCapacity: '5000 kg' },
  { id: 'm2', ayurvedicId: 'AYU-PL-001', name: 'Dr. Priya Nair', organizationName: 'Kerala AYUSH Processing Unit', role: 'Processing & Laboratory', email: 'priya@kerapl.com', phone: '+91 9988776655', region: 'Kerala', address: 'Thrissur, Kerala - 680001', gst: '32FGHIJ5678K2Z6', pan: 'FGHIJ5678K', licenseNumber: 'KL-PL-2024-0008', nablCertificate: 'NABL-KL-2024-089', drugLicense: 'DL-KL-2024-221', status: 'Active', registeredDate: '2024-04-20' },
  { id: 'm3', ayurvedicId: 'AYU-MF-001', name: 'Mr. Deepak Mehta', organizationName: 'AyurNature Products Pvt Ltd', role: 'Manufacturer', email: 'deepak@ayurnature.com', phone: '+91 9871234567', region: 'Gujarat', address: 'Ahmedabad, Gujarat - 380001', gst: '24KLMNO9012L3Z7', pan: 'KLMNO9012L', licenseNumber: 'GJ-MF-2024-0022', gmpCertificate: 'GMP-GJ-2024-056', manufacturingLicense: 'ML-GJ-2024-099', status: 'Active', registeredDate: '2024-02-10' },
  { id: 'm4', ayurvedicId: 'AYU-SC-001', name: 'Mr. Suresh Yadav', organizationName: 'IndiaShip Logistics', role: 'Supply Chain', email: 'suresh@indiaship.com', phone: '+91 9765432109', region: 'Maharashtra', address: 'Mumbai, Maharashtra - 400001', gst: '27PQRST3456M4Z8', pan: 'PQRST3456M', status: 'Active', registeredDate: '2024-05-01', warehouseCapacity: '10,000 sq.ft', vehicleDetails: '8 refrigerated trucks' },
  { id: 'm5', ayurvedicId: 'AYU-CC-002', name: 'Ananya Krishnan', organizationName: 'Himalayan Herb Collectors', role: 'Collection Center', email: 'ananya@hhc.in', phone: '+91 9123456789', region: 'Uttarakhand', address: 'Dehradun, UK - 248001', gst: '05UVWXY7890N5Z9', pan: 'UVWXY7890N', licenseNumber: 'UK-CC-2024-0031', status: 'Pending', registeredDate: '2026-07-14' },
  { id: 'm6', ayurvedicId: 'AYU-MF-002', name: 'Dr. Sanjay Gupta', organizationName: 'Dabur Research Foundation', role: 'Manufacturer', email: 'sanjay@dabur.com', phone: '+91 9812345678', region: 'Uttar Pradesh', address: 'Ghaziabad, UP - 201001', gst: '09ABCFG4321O6Z0', pan: 'ABCFG4321O', status: 'Pending', registeredDate: '2026-07-15' },
];

// ─── MOCK COMPLAINTS ───
export const mockComplaints: Complaint[] = [
  { id: 'CMP-001', batchId: 'BATCH-2026-0038', type: 'Quality', source: 'Processing', description: 'Batch failed heavy metals test. Lead content exceeded permissible limits. Supplier should be investigated.', status: 'Under Review', assignedOfficer: 'Dr. S. Menon', createdAt: '2026-07-03T12:00:00Z', updatedAt: '2026-07-04T09:00:00Z', priority: 'High' },
  { id: 'CMP-002', batchId: 'BATCH-2026-0033', type: 'Delivery', source: 'Supply Chain', description: 'Delivery was delayed by 3 days. Temperature logs show excursion during transit.', status: 'Resolved', assignedOfficer: 'Mr. A. Joshi', resolution: 'Carrier warned. Temperature monitoring upgraded. Product quality unaffected.', createdAt: '2026-07-12T08:00:00Z', updatedAt: '2026-07-14T15:00:00Z', priority: 'Medium' },
  { id: 'CMP-003', batchId: 'BATCH-2026-0047', type: 'Compliance', source: 'Consumer', description: 'QR code scan shows incomplete batch information. Manufacturing date not visible.', status: 'Open', assignedOfficer: '', createdAt: '2026-07-15T16:00:00Z', updatedAt: '2026-07-15T16:00:00Z', priority: 'Low' },
];

// ─── MOCK PAYMENTS ───
export const mockPayments: Payment[] = [
  { id: 'PAY-001', batchId: 'BATCH-2026-0033', stage: 'Collection', amount: 45000, currency: 'INR', status: 'Released', recipient: 'Vikram Singh', recipientRole: 'Collection Center', releasedAt: '2026-06-27T10:00:00Z', createdAt: '2026-06-26T10:00:00Z', blockchainTxId: '0xf1g2...h3i4', remarks: 'Payment for 600 kg Neem @ ₹75/kg' },
  { id: 'PAY-002', batchId: 'BATCH-2026-0033', stage: 'Processing', amount: 18000, currency: 'INR', status: 'Released', recipient: 'Jaipur Processing Unit', recipientRole: 'Processing & Laboratory', releasedAt: '2026-07-02T11:00:00Z', createdAt: '2026-07-01T10:00:00Z', blockchainTxId: '0xj5k6...l7m8' },
  { id: 'PAY-003', batchId: 'BATCH-2026-0033', stage: 'Manufacturing', amount: 120000, currency: 'INR', status: 'Released', recipient: 'AyurNature Products Pvt Ltd', recipientRole: 'Manufacturer', releasedAt: '2026-07-10T09:00:00Z', createdAt: '2026-07-09T10:00:00Z', blockchainTxId: '0xn9o0...p1q2' },
  { id: 'PAY-004', batchId: 'BATCH-2026-0033', stage: 'Supply Chain', amount: 15000, currency: 'INR', status: 'Released', recipient: 'IndiaShip Logistics', recipientRole: 'Supply Chain', releasedAt: '2026-07-13T08:00:00Z', createdAt: '2026-07-12T10:00:00Z', blockchainTxId: '0xr3s4...t5u6' },
  { id: 'PAY-005', batchId: 'BATCH-2026-0047', stage: 'Collection', amount: 33750, currency: 'INR', status: 'Released', recipient: 'Rajesh Kumar', recipientRole: 'Collection Center', releasedAt: '2026-07-11T10:00:00Z', createdAt: '2026-07-10T10:00:00Z', remarks: 'Payment for 450 kg Ashwagandha @ ₹75/kg' },
  { id: 'PAY-006', batchId: 'BATCH-2026-0047', stage: 'Processing', amount: 13500, currency: 'INR', status: 'Pending', recipient: 'Kerala AYUSH Processing Unit', recipientRole: 'Processing & Laboratory', createdAt: '2026-07-12T10:00:00Z' },
];

// ─── MOCK FARMERS ───
export const mockFarmers: Farmer[] = [
  { id: 'f1', farmerId: 'FRM-001', name: 'Rajesh Kumar', village: 'Palakkad', region: 'Kerala', phone: '+91 9876543210', status: 'Active', totalCollections: 12, lastCollection: '2026-07-10', rating: 4.8, bankDetails: 'SBI A/c: ****5432' },
  { id: 'f2', farmerId: 'FRM-002', name: 'Vikram Singh', village: 'Udaipur', region: 'Rajasthan', phone: '+91 9765432109', status: 'Active', totalCollections: 8, lastCollection: '2026-06-25', rating: 4.2 },
  { id: 'f3', farmerId: 'FRM-003', name: 'Amit Patil', village: 'Nashik', region: 'Maharashtra', phone: '+91 9654321098', status: 'Inactive', totalCollections: 5, lastCollection: '2026-07-01', rating: 2.5 },
  { id: 'f4', farmerId: 'FRM-004', name: 'Geeta Sharma', village: 'Jaipur', region: 'Rajasthan', phone: '+91 9543210987', status: 'Active', totalCollections: 15, rating: 4.9 },
];

// ─── MOCK WILD COLLECTORS ───
export const mockWildCollectors: WildCollector[] = [
  { id: 'wc1', collectorId: 'WC-001', name: 'Sunita Devi', village: 'Dehradun', region: 'Uttarakhand', phone: '+91 9432109876', status: 'Active', totalCollections: 7, lastCollection: '2026-07-05', rating: 5.0, forestPermitNo: 'UK-FP-2026-0045' },
  { id: 'wc2', collectorId: 'WC-002', name: 'Mohan Bhat', village: 'Coorg', region: 'Karnataka', phone: '+91 9321098765', status: 'Active', totalCollections: 4, lastCollection: '2026-06-28', rating: 4.3, forestPermitNo: 'KA-FP-2026-0028' },
];

// ─── MOCK AUDIT LOGS ───
export const mockAuditLogs: AuditLog[] = [
  { id: 'al1', txHash: '0x8f3a2b1c9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a', type: 'Batch Certified', entity: 'Kerala Lab Auth', userId: 'u2', userName: 'Dr. Priya Nair', action: 'Lab certificate issued for BATCH-2026-0042', timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), status: 'Committed', blockNumber: 1429847 },
  { id: 'al2', txHash: '0x2a4c6b8d0e2f4a6c8b0d2e4f6a8c0b2d4e6f8a0c', type: 'Collection Verify', entity: 'Western Ghats Center', userId: 'u1', userName: 'Rajan Pillai', action: 'Batch BATCH-2026-0047 created and stored', timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(), status: 'Committed', blockNumber: 1429839 },
  { id: 'al3', txHash: '0x9c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d', type: 'Quality Reject', entity: 'Pune Lab Center', userId: 'u3', userName: 'Dr. Meera Joshi', action: 'BATCH-2026-0038 rejected — heavy metals exceeded limit', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), status: 'Committed', blockNumber: 1429821 },
  { id: 'al4', txHash: '0x1b3d5f7a9c1e3f5a7c9e1f3a5c7e9f1a3c5e7f9a', type: 'Payment Released', entity: 'Government Finance', userId: 'u0', userName: 'Gov Admin', action: 'Payment PAY-005 released ₹33,750 to Rajesh Kumar', timestamp: new Date(Date.now() - 1000 * 60 * 65).toISOString(), status: 'Committed', blockNumber: 1429815 },
  { id: 'al5', txHash: '0x4e6f8a0b2d4f6a8c0e2f4a6c8e0f2a4c6e8f0a2', type: 'Member Registered', entity: 'Government Admin', userId: 'u0', userName: 'Gov Admin', action: 'New member Ananya Krishnan registered, pending approval', timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(), status: 'Committed', blockNumber: 1429801 },
  { id: 'al6', txHash: '0x6f8a0c2e4f6a8c0e2f4a6c8e0f2a4c6e8f0a2c4', type: 'QR Generated', entity: 'Himalaya Drug Company', userId: 'u4', userName: 'Mr. Rohit Verma', action: 'QR code generated for product batch from BATCH-2026-0042', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), status: 'Committed', blockNumber: 1429789 },
];

// ─── MOCK REPORTS ───
export const mockReports: Report[] = [
  { id: 'RPT-001', title: 'Monthly Compliance Summary — June 2026', type: 'Compliance', period: 'Jun 2026', generatedAt: '2026-07-01T09:00:00Z', format: 'PDF', sizeKb: 842, status: 'Ready' },
  { id: 'RPT-002', title: 'Payment Ledger Reconciliation — Q2 2026', type: 'Financial', period: 'Q2 2026', generatedAt: '2026-07-05T10:30:00Z', format: 'XLSX', sizeKb: 1204, status: 'Ready' },
  { id: 'RPT-003', title: 'Quality & Lab Rejection Analysis — June 2026', type: 'Quality', period: 'Jun 2026', generatedAt: '2026-07-03T14:00:00Z', format: 'PDF', sizeKb: 615, status: 'Ready' },
  { id: 'RPT-004', title: 'Batch Traceability Summary — BATCH-2026-0033', type: 'Batch Summary', period: 'Single Batch', generatedAt: '2026-07-13T11:00:00Z', format: 'PDF', sizeKb: 310, status: 'Ready' },
  { id: 'RPT-005', title: 'New Member Onboarding Activity — July 2026', type: 'Member Activity', period: 'Jul 2026', generatedAt: '2026-07-15T08:00:00Z', format: 'CSV', sizeKb: 88, status: 'Ready' },
  { id: 'RPT-006', title: 'Monthly Compliance Summary — July 2026', type: 'Compliance', period: 'Jul 2026', generatedAt: '2026-07-16T06:00:00Z', format: 'PDF', sizeKb: 0, status: 'Generating' },
];

// ─── MOCK MESSAGES ───
export const mockMessageThreads: MessageThread[] = [
  {
    batchId: 'BATCH-2026-0047',
    batchSpecies: 'Ashwagandha',
    isReadOnly: false,
    participants: ['Western Ghats Collection Center', 'Kerala AYUSH Processing Unit'],
    messages: [
      { id: 'msg1', batchId: 'BATCH-2026-0047', senderId: 'u1', senderName: 'Rajan Pillai', senderRole: 'Collection Center', content: 'Batch BATCH-2026-0047 has been dispatched. Please confirm receipt.', timestamp: '2026-07-12T09:00:00Z', isRead: true },
      { id: 'msg2', batchId: 'BATCH-2026-0047', senderId: 'u2', senderName: 'Dr. Priya Nair', senderRole: 'Processing & Laboratory', content: 'Received. Beginning initial inspection. Will update after cleaning phase.', timestamp: '2026-07-12T10:30:00Z', isRead: true },
      { id: 'msg3', batchId: 'BATCH-2026-0047', senderId: 'u2', senderName: 'Dr. Priya Nair', senderRole: 'Processing & Laboratory', content: 'Cleaning completed. Quality looks excellent. Proceeding to drying.', timestamp: '2026-07-13T14:00:00Z', isRead: false },
    ],
    lastMessage: { id: 'msg3', batchId: 'BATCH-2026-0047', senderId: 'u2', senderName: 'Dr. Priya Nair', senderRole: 'Processing & Laboratory', content: 'Cleaning completed. Quality looks excellent. Proceeding to drying.', timestamp: '2026-07-13T14:00:00Z', isRead: false },
  },
  {
    batchId: 'BATCH-2026-0033',
    batchSpecies: 'Neem',
    isReadOnly: true,
    participants: ['All Stakeholders'],
    messages: [
      { id: 'msg4', batchId: 'BATCH-2026-0033', senderId: 'u5', senderName: 'Mr. Suresh Yadav', senderRole: 'Supply Chain', content: 'Delivery completed successfully. Batch closed.', timestamp: '2026-07-12T16:00:00Z', isRead: true },
    ],
    lastMessage: { id: 'msg4', batchId: 'BATCH-2026-0033', senderId: 'u5', senderName: 'Mr. Suresh Yadav', senderRole: 'Supply Chain', content: 'Delivery completed successfully. Batch closed.', timestamp: '2026-07-12T16:00:00Z', isRead: true },
  },
];
