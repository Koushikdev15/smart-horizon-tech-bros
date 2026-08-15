import { Response, NextFunction } from 'express';
import { HealthProfileService } from '../services/HealthProfileService';
import { sendResponse } from '../utils/response';
import { upsertHealthProfileSchema } from '../validators/healthProfileValidator';
import { AuthRequest } from '../middleware/authMiddleware';

export class HealthProfileController {
  private healthProfileService = new HealthProfileService();

  // Ownership is always taken from the verified JWT (req.user.id), never from
  // the request body/params — a client cannot read or write another user's
  // health data by supplying a different id.

  get = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.healthProfileService.getByUserId(req.user.id);
      return sendResponse(res, 200, true, result ? 'Health profile fetched' : 'No health profile set', result);
    } catch (err) {
      next(err);
    }
  };

  upsert = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { error, value } = upsertHealthProfileSchema.validate(req.body);
      if (error) {
        return sendResponse(res, 400, false, 'Validation Error', undefined, error.details);
      }

      const result = await this.healthProfileService.upsert(req.user.id, value);
      return sendResponse(res, 200, true, result ? 'Health profile saved' : 'Health data storage consent withdrawn — profile deleted', result);
    } catch (err) {
      next(err);
    }
  };

  remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await this.healthProfileService.deleteByUserId(req.user.id);
      return sendResponse(res, 200, true, 'Health profile deleted');
    } catch (err) {
      next(err);
    }
  };
}
