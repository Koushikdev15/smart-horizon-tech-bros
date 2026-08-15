import Joi from 'joi';

export const createGuidanceSchema = Joi.object({
  title: Joi.string().required(),
  healthTopic: Joi.string().required(),
  productId: Joi.string().hex().length(24),
  relevantIngredients: Joi.array().items(Joi.string()).default([]),
  description: Joi.string().required(),
  traditionalContext: Joi.string().allow(''),
  recommendedUsage: Joi.string().allow(''),
  precautions: Joi.string().allow(''),
  contraindications: Joi.string().allow(''),
  interactions: Joi.string().allow(''),
  ageConsiderations: Joi.string().allow(''),
  specialPopulationWarnings: Joi.string().allow(''),
  whenToConsultDoctor: Joi.string().allow(''),
  region: Joi.string().allow(''),
  state: Joi.string().allow(''),
  district: Joi.string().allow(''),
  country: Joi.string().allow(''),
  language: Joi.string().valid('en', 'ta').default('en'),
  references: Joi.array().items(Joi.string()).default([]),
});

// Editing (new version) allows a partial payload — unset fields carry over
// from the version being edited.
export const editGuidanceSchema = createGuidanceSchema.fork(
  ['title', 'healthTopic', 'description'],
  (schema) => schema.optional()
);

export const rejectGuidanceSchema = Joi.object({
  reason: Joi.string().min(3).required(),
});
