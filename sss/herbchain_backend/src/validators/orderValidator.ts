import Joi from 'joi';

export const placeOrderSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().hex().length(24).required(),
        storeId: Joi.string().hex().length(24).required(),
        quantity: Joi.number().integer().min(1).required(),
      })
    )
    .min(1)
    .required(),
  deliveryAddress: Joi.string().required(),
  region: Joi.string().required(),
  paymentMethod: Joi.string().valid('COD', 'ONLINE').required(),
});
