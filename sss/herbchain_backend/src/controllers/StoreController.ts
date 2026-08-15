import { Request, Response, NextFunction } from 'express';
import { StoreService } from '../services/StoreService';
import { sendResponse } from '../utils/response';
import { createStoreSchema, updateInventorySchema } from '../validators/storeValidator';
import { AuthRequest } from '../middleware/authMiddleware';

export class StoreController {
  private storeService = new StoreService();

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { error, value } = createStoreSchema.validate(req.body);
      if (error) {
        return sendResponse(res, 400, false, 'Validation Error', undefined, error.details);
      }
      const result = await this.storeService.create(req.user.id, value);
      return sendResponse(res, 201, true, 'Store created', result);
    } catch (err) {
      next(err);
    }
  };

  getOwn = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.storeService.getOwn(req.user.id);
      return sendResponse(res, 200, true, result ? 'Store fetched' : 'No store found', result);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.storeService.update(req.user.id, req.body);
      return sendResponse(res, 200, true, 'Store updated', result);
    } catch (err) {
      next(err);
    }
  };

  upsertInventory = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { error, value } = updateInventorySchema.validate(req.body);
      if (error) {
        return sendResponse(res, 400, false, 'Validation Error', undefined, error.details);
      }
      const result = await this.storeService.upsertInventory(req.user.id, value);
      return sendResponse(res, 200, true, 'Inventory updated', result);
    } catch (err) {
      next(err);
    }
  };

  getOwnInventory = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.storeService.getOwnInventory(req.user.id);
      return sendResponse(res, 200, true, 'Inventory fetched', result);
    } catch (err) {
      next(err);
    }
  };

  findNearby = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { latitude, longitude, maxDistanceKm, productId } = req.query as Record<string, string>;
      if (!latitude || !longitude) {
        return sendResponse(res, 400, false, 'latitude and longitude query params are required');
      }
      const result = await this.storeService.findNearby({
        latitude: Number(latitude),
        longitude: Number(longitude),
        maxDistanceKm: maxDistanceKm ? Number(maxDistanceKm) : undefined,
        productId,
      });
      return sendResponse(res, 200, true, 'Nearby stores fetched', result);
    } catch (err) {
      next(err);
    }
  };
}
