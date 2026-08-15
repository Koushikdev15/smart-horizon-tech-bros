import { apiRequest } from '@/lib/api';

export const COMPLAINT_ISSUE_TYPES = [
  'QR not working',
  'Product details mismatch',
  'Suspicious packaging',
  'Suspicious seller',
  'Damaged product',
  'Incorrect information',
  'Other',
] as const;

export interface Complaint {
  _id: string;
  issueType: string;
  description: string;
  batchId?: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
}

export const complaintService = {
  async submit(data: { issueType: string; description: string; batchId?: string; productId?: string }): Promise<Complaint> {
    return apiRequest('/complaints', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
