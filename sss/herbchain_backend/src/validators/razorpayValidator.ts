import Joi from 'joi';

export const createPaymentOrderSchema = Joi.object({
  orderId: Joi.string().uuid().required(),
});

export const verifyPaymentSchema = Joi.object({
  orderId: Joi.string().uuid().required(),
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
});
