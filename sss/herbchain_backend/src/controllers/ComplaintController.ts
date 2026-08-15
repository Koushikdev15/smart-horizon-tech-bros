import { Response, NextFunction } from 'express';
import { ComplaintService } from '../services/ComplaintService';
import { sendResponse } from '../utils/response';
import { submitComplaintSchema } from '../validators/complaintValidator';
import { AuthRequest } from '../middleware/authMiddleware';

export class ComplaintController {
  private complaintService = new ComplaintService();

  submit = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { error, value } = submitComplaintSchema.validate(req.body);
      if (error) {
        return sendResponse(res, 400, false, 'Validation Error', undefined, error.details);
      }
      const result = await this.complaintService.submit(req.user.id, value);
      return sendResponse(res, 201, true, 'Complaint submitted', result);
    } catch (err) {
      next(err);
    }
  };

  getOwn = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.complaintService.getOwn(req.user.id);
      return sendResponse(res, 200, true, 'Complaints fetched', result);
    } catch (err) {
      next(err);
    }
  };
}
