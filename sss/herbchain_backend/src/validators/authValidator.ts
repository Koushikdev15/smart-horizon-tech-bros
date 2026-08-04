import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  mobile: Joi.string().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('Farmer', 'Wild Collector', 'Collection Center', 'Processing & Laboratory', 'Manufacturer', 'Supply Chain', 'Government').required()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});
