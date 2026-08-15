import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/ProductService';
import { SuitabilityService } from '../services/SuitabilityService';
import { StoreService } from '../services/StoreService';
import { sendResponse } from '../utils/response';
import { createProductSchema, suitabilitySchema } from '../validators/productValidator';
import { AuthRequest } from '../middleware/authMiddleware';

export class ProductController {
  private productService = new ProductService();
  private suitabilityService = new SuitabilityService();
  private storeService = new StoreService();

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { error, value } = createProductSchema.validate(req.body);
      if (error) {
        return sendResponse(res, 400, false, 'Validation Error', undefined, error.details);
      }
      const result = await this.productService.create(req.user.id, value);
      return sendResponse(res, 201, true, 'Product created', result);
    } catch (err) {
      next(err);
    }
  };

  search = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { q, healthTopic, ingredient } = req.query as Record<string, string>;
      const result = await this.productService.search({ q, healthTopic, ingredient });
      return sendResponse(res, 200, true, 'Products fetched', result);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.productService.getById(req.params.id as string);
      return sendResponse(res, 200, true, 'Product fetched', result);
    } catch (err) {
      next(err);
    }
  };

  browseForPurchase = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { q, healthTopic, region } = req.query as Record<string, string>;
      const result = await this.productService.browseForPurchase({ q, healthTopic, region });
      return sendResponse(res, 200, true, 'Products fetched', result);
    } catch (err) {
      next(err);
    }
  };

  getOffers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { region } = req.query as Record<string, string>;
      const result = await this.storeService.listOffers(req.params.id as string, region);
      return sendResponse(res, 200, true, 'Offers fetched', result);
    } catch (err) {
      next(err);
    }
  };

  getByQrCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.productService.getByQrCode(req.params.qrCode as string);
      return sendResponse(res, 200, true, 'Product fetched', result);
    } catch (err) {
      next(err);
    }
  };

  checkSuitability = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { error, value } = suitabilitySchema.validate(req.body);
      if (error) {
        return sendResponse(res, 400, false, 'Validation Error', undefined, error.details);
      }
      const result = await this.suitabilityService.check(req.user.id, value);
      return sendResponse(res, 200, true, 'Suitability check complete', result);
    } catch (err) {
      next(err);
    }
  };
}
