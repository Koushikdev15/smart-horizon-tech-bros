import { Request, Response, NextFunction } from 'express';
import { AdminComplaintService } from '../services/AdminComplaintService';
import { sendResponse } from '../utils/response';
import { updateComplaintStatusSchema } from '../validators/complaintValidator';
import { AuthRequest } from '../middleware/authMiddleware';

export class AdminComplaintController {
  private adminComplaintService = new AdminComplaintService();

  listAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.query as Record<string, string>;
      const result = await this.adminComplaintService.listAll({ status });
      return sendResponse(res, 200, true, 'Complaints fetched', result);
    } catch (err) {
      next(err);
    }
  };

  updateStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { error, value } = updateComplaintStatusSchema.validate(req.body);
      if (error) {
        return sendResponse(res, 400, false, 'Validation Error', undefined, error.details);
      }
      const result = await this.adminComplaintService.updateStatus(req.user.id, req.params.id as string, value.status, value.adminNotes);
      return sendResponse(res, 200, true, 'Complaint updated', result);
    } catch (err) {
      next(err);
    }
  };
}
