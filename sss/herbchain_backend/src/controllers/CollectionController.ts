import { Request, Response, NextFunction } from 'express';
import { CollectionService } from '../services/CollectionService';
import { sendResponse } from '../utils/response';
import { submitCollectionSchema } from '../validators/collectionValidator';
import { AuthRequest } from '../middleware/authMiddleware';

export class CollectionController {
  private service = new CollectionService();

  submit = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { error } = submitCollectionSchema.validate(req.body);
      if (error) {
        return sendResponse(res, 400, false, 'Validation Error', undefined, error.details);
      }

      if (!req.file) {
        return sendResponse(res, 400, false, 'Image is required for AI verification');
      }

      const farmerId = req.user.id;
      const result = await this.service.submitCollection(farmerId, req.body, req.file.buffer);

      return sendResponse(res, 201, true, 'Collection submitted and verified successfully', result);
    } catch (err) {
      next(err);
    }
  };

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const results = await this.service.getAllCollections();
      return sendResponse(res, 200, true, 'Collections fetched', results);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const result = await this.service.getCollectionById(id);
      return sendResponse(res, 200, true, 'Collection fetched', result);
    } catch (err) {
      next(err);
    }
  };
}
