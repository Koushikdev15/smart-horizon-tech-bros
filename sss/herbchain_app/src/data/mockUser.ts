import type { User, ScanHistoryItem } from '@/types';

export const MOCK_USER: User = {
  id: 'user-001',
  name: 'Koushik',
  email: 'koushik@example.com',
  phone: '+91 9876543210',
  language: 'en',
  isGuest: false,
};

export const MOCK_SCAN_HISTORY: ScanHistoryItem[] = [
  {
    id: 'scan-001',
    productId: 'prod-001',
    productName: 'Ashwagandha Capsules',
    manufacturer: 'AyurTrace Demo Herbal Labs',
    batchId: 'AYUR-ASH-2026-000458',
    scanDate: '2026-08-10',
    trustScore: 96,
    status: 'verified',
  },
  {
    id: 'scan-002',
    productId: 'prod-002',
    productName: 'Tulsi Herbal Extract',
    manufacturer: 'Kerala Ayurveda Labs',
    batchId: 'AYUR-TUL-2026-000271',
    scanDate: '2026-08-08',
    trustScore: 92,
    status: 'verified',
  },
  {
    id: 'scan-003',
    productId: 'prod-003',
    productName: 'Amla Herbal Powder',
    manufacturer: 'Vaidya Naturals',
    batchId: 'AYUR-AML-2026-000198',
    scanDate: '2026-08-05',
    trustScore: 94,
    status: 'verified',
  },
  {
    id: 'scan-004',
    productId: 'prod-004',
    productName: 'Triphala Tablets',
    manufacturer: 'Recalled Pharma Co.',
    batchId: 'AYUR-TRI-2026-000099',
    scanDate: '2026-07-20',
    trustScore: 28,
    status: 'recalled',
    statusUpdated: true,
  },
];

export const MOCK_SAVED_PRODUCT_IDS: string[] = ['prod-001', 'prod-002', 'prod-003'];
