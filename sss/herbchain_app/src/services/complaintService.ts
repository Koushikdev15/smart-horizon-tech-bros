import { supabase } from '@/lib/supabase';

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
  id: string;
  issueType: string;
  description: string;
  batchId?: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
}

export const complaintService = {
  async submit(data: { issueType: string; description: string; batchId?: string; productId?: string }): Promise<Complaint> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Sign in to submit a report.');

    const { data: row, error } = await supabase
      .from('customer_complaints')
      .insert({
        user_id: user.id,
        issue_type: data.issueType,
        description: data.description,
        batch_id: data.batchId ?? null,
        product_id: data.productId ?? null,
      })
      .select('*')
      .single();

    if (error || !row) throw error ?? new Error('Could not submit your report.');

    return {
      id: row.id,
      issueType: row.issue_type,
      description: row.description,
      batchId: row.batch_id ?? undefined,
      status: row.status,
      createdAt: row.created_at,
    };
  },
};
