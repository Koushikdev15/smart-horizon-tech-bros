import { Request, Response, NextFunction } from 'express';
import { ManufacturingService } from '../services/ManufacturingService';
import { sendResponse } from '../utils/response';
import { AuthRequest } from '../middleware/authMiddleware';

export class ManufacturingController {
  private service = new ManufacturingService();

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.createProduct(req.user.id, req.body);
      return sendResponse(res, 201, true, 'Product manufactured successfully', result);
    } catch (err) {
      next(err);
    }
  };
}
