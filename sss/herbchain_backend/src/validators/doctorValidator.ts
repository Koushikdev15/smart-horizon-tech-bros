import Joi from 'joi';

export const submitDoctorSchema = Joi.object({
  name: Joi.string().required(),
  qualification: Joi.string().required(),
  specialization: Joi.string().required(),
  registrationNumber: Joi.string().required(),
  clinic: Joi.string().required(),
  region: Joi.string().required(),
  state: Joi.string().required(),
  country: Joi.string().required(),
  languages: Joi.array().items(Joi.string()).default([]),
  contactPhone: Joi.string().allow(''),
  contactEmail: Joi.string().email().allow(''),
});

export const adminDoctorActionSchema = Joi.object({
  reason: Joi.string().allow(''),
});

// Reject/suspend/revoke need an actual reason — approve doesn't.
export const adminDoctorReasonRequiredSchema = Joi.object({
  reason: Joi.string().min(3).required(),
});
