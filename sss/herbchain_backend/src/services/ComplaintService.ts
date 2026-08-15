import { Complaint } from '../models/Complaint';
import { AuditLogService } from './AuditLogService';

export class ComplaintService {
  private auditLogService = new AuditLogService();

  async submit(userId: string, data: any) {
    const complaint = await Complaint.create({ ...data, userId });
    await this.auditLogService.record({
      actorId: userId,
      action: 'COMPLAINT_SUBMITTED',
      targetType: 'Complaint',
      targetId: String(complaint._id),
      newStatus: 'OPEN',
    });
    return complaint;
  }

  async getOwn(userId: string) {
    return Complaint.find({ userId }).sort({ createdAt: -1 });
  }
}
