import { Request, Response, NextFunction } from 'express';
import { BatchService } from '../services/BatchService';
import { sendResponse } from '../utils/response';
import { AuthRequest } from '../middleware/authMiddleware';

export class BatchController {
  private service = new BatchService();

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.body.collectionIds || !Array.isArray(req.body.collectionIds)) {
        return sendResponse(res, 400, false, 'collectionIds array is required');
      }

      const centerId = req.user.id;
      const result = await this.service.createBatch(centerId, req.body.collectionIds);

      return sendResponse(res, 201, true, 'Batch created successfully', result);
    } catch (err) {
      next(err);
    }
  };

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const results = await this.service.getAllBatches();
      return sendResponse(res, 200, true, 'Batches fetched', results);
    } catch (err) {
      next(err);
    }
  };
}
