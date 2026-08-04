import { Request, Response, NextFunction } from 'express';
import { ProcessingService } from '../services/ProcessingService';
import { sendResponse } from '../utils/response';
import { AuthRequest } from '../middleware/authMiddleware';

export class ProcessingController {
  private service = new ProcessingService();

  addStep = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const processorId = req.user.id;
      const reportBuffer = req.file ? req.file.buffer : undefined;

      const result = await this.service.addStep(req.body.batchId, processorId, req.body, reportBuffer);
      return sendResponse(res, 201, true, 'Processing step recorded', result);
    } catch (err) {
      next(err);
    }
  };
}
