import Joi from 'joi';

export const submitCollectionSchema = Joi.object({
  species: Joi.string().required(),
  quantity: Joi.number().min(0.1).required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required()
});
