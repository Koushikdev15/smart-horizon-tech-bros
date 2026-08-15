import Joi from 'joi';

export const sendMessageSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required(),
  // Optional — enables "find products/stores near me" for this turn. Never
  // stored beyond this request.
  coordinates: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
  }),
});
