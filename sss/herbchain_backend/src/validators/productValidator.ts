import Joi from 'joi';

export const createProductSchema = Joi.object({
  productName: Joi.string().required(),
  ingredients: Joi.array()
    .items(Joi.object({ name: Joi.string().required(), scientificName: Joi.string().allow('') }))
    .default([]),
  healthTopics: Joi.array().items(Joi.string()).default([]),
  description: Joi.string().allow(''),
  usageInstructions: Joi.string().allow(''),
  precautions: Joi.string().allow(''),
  contraindications: Joi.string().allow(''),
  qrCode: Joi.string().allow(''),
});

export const suitabilitySchema = Joi.object({
  productId: Joi.string().hex().length(24),
  productName: Joi.string(),
})
  .or('productId', 'productName')
  .messages({ 'object.missing': 'Provide either productId or productName' });
