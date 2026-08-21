import { Response, NextFunction } from 'express';
import { RazorpayService } from '../services/RazorpayService';
import { toOrderResponse } from '../services/OrderService';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { sendResponse } from '../utils/response';
import { createPaymentOrderSchema, verifyPaymentSchema } from '../validators/razorpayValidator';
import { SupabaseAuthRequest } from '../middleware/supabaseAuthMiddleware';

export class RazorpayController {
  private razorpayService = new RazorpayService();

  createPaymentOrder = async (req: SupabaseAuthRequest, res: Response, next: NextFunction) => {
    try {
      const { error, value } = createPaymentOrderSchema.validate(req.body);
      if (error) {
        return sendResponse(res, 400, false, 'Validation Error', undefined, error.details);
      }

      const { data: order, error: fetchError } = await supabaseAdmin
        .from('customer_orders')
        .select('*')
        .eq('id', value.orderId)
        .eq('user_id', req.supabaseUser!.id)
        .maybeSingle();

      if (fetchError || !order) {
        throw { status: 404, message: 'Order not found', isOperational: true };
      }
      if (order.payment_method !== 'ONLINE' || order.payment_status !== 'PENDING') {
        throw { status: 400, message: 'This order is not awaiting online payment.', isOperational: true };
      }

      const result = await this.razorpayService.createOrder(order.id, Number(order.total_amount));

      await supabaseAdmin.from('customer_orders').update({ razorpay_order_id: result.razorpayOrderId }).eq('id', order.id);

      return sendResponse(res, 200, true, 'Payment order created', {
        razorpayOrderId: result.razorpayOrderId,
        amountPaise: result.amountPaise,
        currency: result.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        orderId: order.id,
      });
    } catch (err) {
      next(err);
    }
  };

  verifyPayment = async (req: SupabaseAuthRequest, res: Response, next: NextFunction) => {
    try {
      const { error, value } = verifyPaymentSchema.validate(req.body);
      if (error) {
        return sendResponse(res, 400, false, 'Validation Error', undefined, error.details);
      }

      const { data: order, error: fetchError } = await supabaseAdmin
        .from('customer_orders')
        .select('*, customer_order_items(*)')
        .eq('id', value.orderId)
        .eq('user_id', req.supabaseUser!.id)
        .maybeSingle();

      if (fetchError || !order) {
        throw { status: 404, message: 'Order not found', isOperational: true };
      }

      const isValid = this.razorpayService.verifySignature({
        razorpay_order_id: value.razorpay_order_id,
        razorpay_payment_id: value.razorpay_payment_id,
        razorpay_signature: value.razorpay_signature,
      });

      const newStatus = isValid ? 'PAID' : 'FAILED';
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('customer_orders')
        .update({ payment_status: newStatus, razorpay_payment_id: value.razorpay_payment_id })
        .eq('id', order.id)
        .select('*, customer_order_items(*)')
        .single();

      if (updateError || !updated) {
        throw { status: 500, message: 'Could not update order status.', isOperational: true };
      }

      if (!isValid) {
        return sendResponse(res, 400, false, 'Payment verification failed.', toOrderResponse(updated, updated.customer_order_items ?? []));
      }
      return sendResponse(res, 200, true, 'Payment verified', toOrderResponse(updated, updated.customer_order_items ?? []));
    } catch (err) {
      next(err);
    }
  };
}
