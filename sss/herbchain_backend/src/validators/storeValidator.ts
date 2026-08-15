import Joi from 'joi';

export const createStoreSchema = Joi.object({
  name: Joi.string().required(),
  storeType: Joi.string().valid('Pharmacy', 'Ayurvedic Store', 'Distributor Outlet', 'Other').default('Pharmacy'),
  address: Joi.string().required(),
  region: Joi.string().required(),
  state: Joi.string().required(),
  country: Joi.string().required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  phone: Joi.string().allow(''),
  openTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/),
  closeTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/),
  is24Hours: Joi.boolean().default(false),
});

export const updateInventorySchema = Joi.object({
  productId: Joi.string().hex().length(24).required(),
  available: Joi.boolean().default(true),
  quantity: Joi.number().min(0),
  price: Joi.number().min(0),
});
