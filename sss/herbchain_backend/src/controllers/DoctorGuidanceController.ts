import { Request, Response, NextFunction } from 'express';
import { DoctorGuidanceService } from '../services/DoctorGuidanceService';
import { sendResponse } from '../utils/response';
import { createGuidanceSchema, editGuidanceSchema } from '../validators/doctorGuidanceValidator';
import { AuthRequest } from '../middleware/authMiddleware';

export class DoctorGuidanceController {
  private guidanceService = new DoctorGuidanceService();

  createDraft = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { error, value } = createGuidanceSchema.validate(req.body);
      if (error) {
        return sendResponse(res, 400, false, 'Validation Error', undefined, error.details);
      }
      const result = await this.guidanceService.createDraft(req.user.id, value);
      return sendResponse(res, 201, true, 'Guidance draft created', result);
    } catch (err) {
      next(err);
    }
  };

  createNewVersion = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { error, value } = editGuidanceSchema.validate(req.body);
      if (error) {
        return sendResponse(res, 400, false, 'Validation Error', undefined, error.details);
      }
      const result = await this.guidanceService.createNewVersion(req.user.id, req.params.guidanceId as string, value);
      return sendResponse(res, 201, true, 'New guidance version created', result);
    } catch (err) {
      next(err);
    }
  };

  submit = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.guidanceService.submit(req.user.id, req.params.versionId as string);
      return sendResponse(res, 200, true, 'Guidance submitted for review', result);
    } catch (err) {
      next(err);
    }
  };

  listOwn = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.guidanceService.listOwn(req.user.id);
      return sendResponse(res, 200, true, 'Your guidance fetched', result);
    } catch (err) {
      next(err);
    }
  };

  getOwnVersionHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.guidanceService.getOwnVersionHistory(req.user.id, req.params.guidanceId as string);
      return sendResponse(res, 200, true, 'Version history fetched', result);
    } catch (err) {
      next(err);
    }
  };

  listPublished = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productId, healthTopic, region, country, language } = req.query as Record<string, string>;
      const result = await this.guidanceService.findPublished({ productId, healthTopic, region, country, language });
      return sendResponse(res, 200, true, 'Published guidance fetched', result);
    } catch (err) {
      next(err);
    }
  };

  getPublished = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.guidanceService.getPublishedByGuidanceId(req.params.guidanceId as string);
      return sendResponse(res, 200, true, 'Guidance fetched', result);
    } catch (err) {
      next(err);
    }
  };
}
