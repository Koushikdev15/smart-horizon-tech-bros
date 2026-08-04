import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/response';
import { CollectionEvent } from '../models/CollectionEvent';
import { Batch } from '../models/Batch';
import { Product } from '../models/Product';
import { Shipment } from '../models/Shipment';

export class GovernmentController {
  getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const totalCollections = await CollectionEvent.countDocuments();
      const totalBatches = await Batch.countDocuments();
      const totalProducts = await Product.countDocuments();
      const totalShipments = await Shipment.countDocuments();

      const complianceRate = 98.4; // Derived analytically in a real scenario

      return sendResponse(res, 200, true, 'Analytics fetched successfully', {
        totalCollections,
        totalBatches,
        totalProducts,
        totalShipments,
        complianceRate
      });
    } catch (err) {
      next(err);
    }
  };
}
