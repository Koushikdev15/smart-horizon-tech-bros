import { supabaseAdmin } from '../lib/supabaseAdmin';
import { AuditLogService } from './AuditLogService';

export type ComplaintStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';

/**
 * Complaints now live in Supabase (public.customer_complaints — see
 * herbchain_app/supabase/migrations/0007_customer_complaints.sql), written
 * directly by the app with the customer's own session. Admin review still
 * authenticates the normal Mongo-JWT way (adminComplaintRoutes is unchanged)
 * — only the data source here changed, via the service-role key.
 */
export class AdminComplaintService {
  private auditLogService = new AuditLogService();

  async listAll(filters: { status?: string }) {
    let query = supabaseAdmin.from('customer_complaints').select('*').order('created_at', { ascending: false });
    if (filters.status) query = query.eq('status', filters.status);

    const { data, error } = await query;
    if (error) {
      throw { status: 500, message: 'Could not load complaints.', isOperational: true };
    }
    return (data ?? []).map(toComplaintResponse);
  }

  async updateStatus(adminId: string, id: string, status: ComplaintStatus, adminNotes?: string) {
    const { data: existing, error: findError } = await supabaseAdmin
      .from('customer_complaints')
      .select('id, status')
      .eq('id', id)
      .maybeSingle();
    if (findError || !existing) {
      throw { status: 404, message: 'Complaint not found', isOperational: true };
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('customer_complaints')
      .update({
        status,
        admin_notes: adminNotes ?? undefined,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError || !updated) {
      throw { status: 500, message: 'Could not update complaint.', isOperational: true };
    }

    await this.auditLogService.record({
      actorId: adminId,
      action: 'COMPLAINT_STATUS_UPDATED',
      targetType: 'Complaint',
      targetId: id,
      previousStatus: existing.status,
      newStatus: status,
      reason: adminNotes,
    });

    return toComplaintResponse(updated);
  }
}

function toComplaintResponse(row: Record<string, any>) {
  return {
    _id: row.id,
    userId: row.user_id,
    productId: row.product_id ?? undefined,
    batchId: row.batch_id ?? undefined,
    issueType: row.issue_type,
    description: row.description,
    status: row.status,
    adminNotes: row.admin_notes ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
