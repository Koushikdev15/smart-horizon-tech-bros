import { Complaint, ComplaintStatus } from '../models/Complaint';
import { AuditLogService } from './AuditLogService';

export class AdminComplaintService {
  private auditLogService = new AuditLogService();

  async listAll(filters: { status?: string }) {
    const query: Record<string, unknown> = {};
    if (filters.status) query.status = filters.status;
    return Complaint.find(query).sort({ createdAt: -1 });
  }

  async updateStatus(adminId: string, id: string, status: ComplaintStatus, adminNotes?: string) {
    const complaint = await Complaint.findById(id);
    if (!complaint) {
      throw { status: 404, message: 'Complaint not found', isOperational: true };
    }

    const previousStatus = complaint.status;
    complaint.status = status;
    complaint.adminNotes = adminNotes ?? complaint.adminNotes;
    complaint.reviewedBy = adminId as any;
    complaint.reviewedAt = new Date();
    await complaint.save();

    await this.auditLogService.record({
      actorId: adminId,
      action: 'COMPLAINT_STATUS_UPDATED',
      targetType: 'Complaint',
      targetId: String(complaint._id),
      previousStatus,
      newStatus: status,
      reason: adminNotes,
    });

    return complaint;
  }
}
