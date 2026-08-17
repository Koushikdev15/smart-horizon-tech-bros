import Joi from 'joi';

const triState = Joi.string().valid('no', 'yes', 'undisclosed');

export const upsertHealthProfileSchema = Joi.object({
  hasAllergies: triState,
  allergies: Joi.array().items(Joi.string()),
  allergyNotes: Joi.string().allow(''),
  ingredientAllergies: Joi.array().items(Joi.string()),

  hasCurrentHealthIssues: triState,
  currentHealthIssues: Joi.string().allow(''),

  hasExistingConditions: triState,
  conditions: Joi.array().items(Joi.string()),

  medicalHistoryTags: Joi.array().items(Joi.string()),
  medicalHistory: Joi.string().allow(''),
  currentMedicationTags: Joi.array().items(Joi.string()),
  currentMedications: Joi.string().allow(''),
  previousAdverseReactions: Joi.string().allow(''),

  pregnancyStatus: Joi.string().valid('not_applicable', 'pregnant', 'breastfeeding', 'planning', 'undisclosed'),
  dietaryPreferences: Joi.array().items(Joi.string()),
  ayurvedicPreferences: Joi.array().items(Joi.string()),

  consentStoreHealthData: Joi.boolean(),
  consentPersonalizedAlerts: Joi.boolean(),
});
