import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

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
  photoUrl?: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
}

export const complaintService = {
  /** Reads the local file as base64 and uploads via ArrayBuffer — a plain
   *  fetch(uri).blob() silently reads near-empty data from a local file://
   *  URI under React Native's New Architecture (confirmed this session on
   *  the chat voice/image upload path), so every RN-originated file upload
   *  in this app goes through this same base64 route instead. */
  async uploadPhoto(uri: string): Promise<string> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not signed in.');

    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('complaint-photos')
      .upload(path, decode(base64), { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}` });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('complaint-photos').getPublicUrl(path);
    return data.publicUrl;
  },

  async submit(data: {
    issueType: string;
    description: string;
    batchId?: string;
    productId?: string;
    photoUrl?: string;
  }): Promise<Complaint> {
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
        photo_url: data.photoUrl ?? null,
      })
      .select('*')
      .single();

    if (error || !row) throw error ?? new Error('Could not submit your report.');

    return {
      id: row.id,
      issueType: row.issue_type,
      description: row.description,
      batchId: row.batch_id ?? undefined,
      photoUrl: row.photo_url ?? undefined,
      status: row.status,
      createdAt: row.created_at,
    };
  },
};
