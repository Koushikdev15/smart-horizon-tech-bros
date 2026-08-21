import Razorpay from 'razorpay';
import crypto from 'crypto';
import logger from '../utils/logger';

export class RazorpayUnavailableError extends Error {
  constructor(message = 'Online payment is temporarily unavailable. Please try Cash on Delivery instead.') {
    super(message);
    this.name = 'RazorpayUnavailableError';
  }
}

/**
 * Thin, isolated wrapper around the Razorpay Orders API — the key secret
 * lives only here, on the backend, and is never sent to the app (only the
 * publishable key_id is, via RazorpayController.createPaymentOrder).
 */
export class RazorpayService {
  private client: Razorpay | null;
  private keySecret: string | null;

  constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    this.client = keyId && keySecret ? new Razorpay({ key_id: keyId, key_secret: keySecret }) : null;
    this.keySecret = keySecret ?? null;
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  async createOrder(internalOrderId: string, amountRupees: number): Promise<{ razorpayOrderId: string; amountPaise: number; currency: string }> {
    if (!this.client) {
      throw new RazorpayUnavailableError('Online payment is not configured (missing RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET).');
    }
    try {
      const amountPaise = Math.round(amountRupees * 100);
      const order = await this.client.orders.create({
        amount: amountPaise,
        currency: 'INR',
        receipt: internalOrderId,
      });
      return { razorpayOrderId: order.id, amountPaise, currency: order.currency };
    } catch (err) {
      logger.error(`[RazorpayService] createOrder failed: ${(err as Error).message}`);
      throw new RazorpayUnavailableError();
    }
  }

  verifySignature(params: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }): boolean {
    if (!this.keySecret) return false;
    const expected = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${params.razorpay_order_id}|${params.razorpay_payment_id}`)
      .digest('hex');
    return expected === params.razorpay_signature;
  }
}
