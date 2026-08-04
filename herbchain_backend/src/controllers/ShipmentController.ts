import { Request, Response, NextFunction } from 'express';
import { ShipmentService } from '../services/ShipmentService';
import { sendResponse } from '../utils/response';
import { AuthRequest } from '../middleware/authMiddleware';

export class ShipmentController {
  private service = new ShipmentService();

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.createShipment(req.user.id, req.body);
      return sendResponse(res, 201, true, 'Shipment started', result);
    } catch (err) {
      next(err);
    }
  };
}
