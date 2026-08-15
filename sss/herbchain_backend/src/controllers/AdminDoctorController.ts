import { Request, Response, NextFunction } from 'express';
import { AdminDoctorService } from '../services/AdminDoctorService';
import { sendResponse } from '../utils/response';
import { adminDoctorReasonRequiredSchema } from '../validators/doctorValidator';
import { AuthRequest } from '../middleware/authMiddleware';

export class AdminDoctorController {
  private adminDoctorService = new AdminDoctorService();

  listPending = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.adminDoctorService.listPending();
      return sendResponse(res, 200, true, 'Pending doctors fetched', result);
    } catch (err) {
      next(err);
    }
  };

  listAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, region, specialization } = req.query as Record<string, string>;
      const result = await this.adminDoctorService.listAll({ status, region, specialization });
      return sendResponse(res, 200, true, 'Doctors fetched', result);
    } catch (err) {
      next(err);
    }
  };

  getFullDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.adminDoctorService.getFullDetail(req.params.id as string);
      return sendResponse(res, 200, true, 'Doctor fetched', result);
    } catch (err) {
      next(err);
    }
  };

  approve = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.adminDoctorService.approve(req.user.id, req.params.id as string);
      return sendResponse(res, 200, true, 'Doctor verified', result);
    } catch (err) {
      next(err);
    }
  };

  reject = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { error, value } = adminDoctorReasonRequiredSchema.validate(req.body);
      if (error) {
        return sendResponse(res, 400, false, 'A reason is required to reject a doctor', undefined, error.details);
      }
      const result = await this.adminDoctorService.reject(req.user.id, req.params.id as string, value.reason);
      return sendResponse(res, 200, true, 'Doctor rejected', result);
    } catch (err) {
      next(err);
    }
  };

  suspend = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { error, value } = adminDoctorReasonRequiredSchema.validate(req.body);
      if (error) {
        return sendResponse(res, 400, false, 'A reason is required to suspend a doctor', undefined, error.details);
      }
      const result = await this.adminDoctorService.suspend(req.user.id, req.params.id as string, value.reason);
      return sendResponse(res, 200, true, 'Doctor suspended', result);
    } catch (err) {
      next(err);
    }
  };

  revoke = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { error, value } = adminDoctorReasonRequiredSchema.validate(req.body);
      if (error) {
        return sendResponse(res, 400, false, 'A reason is required to revoke a doctor', undefined, error.details);
      }
      const result = await this.adminDoctorService.revoke(req.user.id, req.params.id as string, value.reason);
      return sendResponse(res, 200, true, 'Doctor revoked', result);
    } catch (err) {
      next(err);
    }
  };

  auditLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.adminDoctorService.listAuditLogs(req.params.id as string);
      return sendResponse(res, 200, true, 'Audit log fetched', result);
    } catch (err) {
      next(err);
    }
  };
}
