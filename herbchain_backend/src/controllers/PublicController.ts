import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/response';
import { FabricService } from '../integrations/fabric/FabricService';
import { Product } from '../models/Product';
import { Batch } from '../models/Batch';

export class PublicController {
  private fabricService = new FabricService();

  getProvenance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const batchId = req.params.batchId as string;
      // In a real scenario, this gets the immutable timeline from Fabric
      const provenance = await this.fabricService.ConsumerVerification(batchId);
      
      return sendResponse(res, 200, true, 'Provenance retrieved successfully', provenance);
    } catch (err) {
      next(err);
    }
  };
}
