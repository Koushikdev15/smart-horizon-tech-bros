import Joi from 'joi';
import { USER_ROLES } from '../models/User';

export const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  mobile: Joi.string().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid(...USER_ROLES).required(),

  // Optional consumer-profile fields (Customer registration).
  language: Joi.string().valid('en', 'ta'),
  dateOfBirth: Joi.string().isoDate(),
  aadhaarLast4: Joi.string().pattern(/^[0-9]{4}$/),
  panLast4: Joi.string().pattern(/^[A-Z0-9]{4}$/),
  occupation: Joi.string().allow(''),
  religion: Joi.string().allow(''),
  region: Joi.string().allow(''),
  address: Joi.string().allow(''),
  coordinates: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
  }),
  profileCompletion: Joi.number().min(0).max(100),
});

export const loginSchema = Joi.object({
  email: Joi.string().required(),
  password: Joi.string().required()
});

export const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});
