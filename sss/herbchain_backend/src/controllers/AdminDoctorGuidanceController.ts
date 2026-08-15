import { Request, Response, NextFunction } from 'express';
import { AdminDoctorGuidanceService } from '../services/AdminDoctorGuidanceService';
import { sendResponse } from '../utils/response';
import { rejectGuidanceSchema } from '../validators/doctorGuidanceValidator';
import { AuthRequest } from '../middleware/authMiddleware';

export class AdminDoctorGuidanceController {
  private adminGuidanceService = new AdminDoctorGuidanceService();

  listSubmitted = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.adminGuidanceService.listSubmitted();
      return sendResponse(res, 200, true, 'Submitted guidance fetched', result);
    } catch (err) {
      next(err);
    }
  };

  getVersionDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.adminGuidanceService.getVersionDetail(req.params.versionId as string);
      return sendResponse(res, 200, true, 'Guidance version fetched', result);
    } catch (err) {
      next(err);
    }
  };

  approve = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.adminGuidanceService.approve(req.user.id, req.params.versionId as string);
      return sendResponse(res, 200, true, 'Guidance published', result);
    } catch (err) {
      next(err);
    }
  };

  reject = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { error, value } = rejectGuidanceSchema.validate(req.body);
      if (error) {
        return sendResponse(res, 400, false, 'A reason is required to reject guidance', undefined, error.details);
      }
      const result = await this.adminGuidanceService.reject(req.user.id, req.params.versionId as string, value.reason);
      return sendResponse(res, 200, true, 'Guidance rejected', result);
    } catch (err) {
      next(err);
    }
  };
}
