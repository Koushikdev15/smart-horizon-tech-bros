import { Request, Response, NextFunction } from 'express';
import { AuditLogService } from '../services/AuditLogService';
import { sendResponse } from '../utils/response';

export class AuditLogController {
  private auditLogService = new AuditLogService();

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { targetType, targetId, action } = req.query as Record<string, string>;
      const result = await this.auditLogService.list({ targetType, targetId, action });
      return sendResponse(res, 200, true, 'Audit logs fetched', result);
    } catch (err) {
      next(err);
    }
  };
}
