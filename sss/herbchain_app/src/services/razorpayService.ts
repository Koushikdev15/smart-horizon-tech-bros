import { apiRequest } from '@/lib/api';
import type { Order } from './ebuyService';

export interface RazorpayOrderDetails {
  razorpayOrderId: string;
  amountPaise: number;
  currency: string;
  keyId: string;
  orderId: string;
}

export const razorpayService = {
  async createOrder(orderId: string): Promise<RazorpayOrderDetails> {
    return apiRequest('/razorpay/create-order', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });
  },

  async verifyPayment(params: {
    orderId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<Order> {
    return apiRequest('/razorpay/verify', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },
};
