import { AuditLog } from '../models/AuditLog';

interface RecordAuditLogInput {
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  previousStatus?: string;
  newStatus?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export class AuditLogService {
  async record(input: RecordAuditLogInput) {
    return AuditLog.create(input);
  }

  async list(filters: { targetType?: string; targetId?: string; action?: string }) {
    const query: Record<string, unknown> = {};
    if (filters.targetType) query.targetType = filters.targetType;
    if (filters.targetId) query.targetId = filters.targetId;
    if (filters.action) query.action = filters.action;
    return AuditLog.find(query).sort({ createdAt: -1 }).limit(200);
  }
}
