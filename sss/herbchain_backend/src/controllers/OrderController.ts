import { Response, NextFunction } from 'express';
import { OrderService } from '../services/OrderService';
import { sendResponse } from '../utils/response';
import { placeOrderSchema } from '../validators/orderValidator';
import { SupabaseAuthRequest } from '../middleware/supabaseAuthMiddleware';

export class OrderController {
  private orderService = new OrderService();

  placeOrder = async (req: SupabaseAuthRequest, res: Response, next: NextFunction) => {
    try {
      const { error, value } = placeOrderSchema.validate(req.body);
      if (error) {
        return sendResponse(res, 400, false, 'Validation Error', undefined, error.details);
      }
      const result = await this.orderService.placeOrder(req.supabaseUser!.id, value);
      return sendResponse(res, 201, true, 'Order placed', result);
    } catch (err) {
      next(err);
    }
  };

  getOwn = async (req: SupabaseAuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.orderService.getOwn(req.supabaseUser!.id);
      return sendResponse(res, 200, true, 'Orders fetched', result);
    } catch (err) {
      next(err);
    }
  };

  getOwnById = async (req: SupabaseAuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.orderService.getOwnById(req.supabaseUser!.id, req.params.id as string);
      return sendResponse(res, 200, true, 'Order fetched', result);
    } catch (err) {
      next(err);
    }
  };
}
