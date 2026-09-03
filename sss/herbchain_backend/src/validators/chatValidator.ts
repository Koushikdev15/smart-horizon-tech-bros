import Joi from 'joi';

export const sendMessageSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required(),
  // Optional — enables "find products/stores near me" for this turn. Never
  // stored beyond this request.
  coordinates: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
  }),
  // Optional — set only by the doctor-consult screen. Switches the reply to
  // that specific doctor's consultation persona instead of the general
  // AyurTrace+ assistant.
  doctorId: Joi.string().min(1).max(100),
});

// Same shape as sendMessageSchema plus the base64-encoded file itself —
// content is optional since an image/document can stand on its own.
export const sendImageMessageSchema = Joi.object({
  content: Joi.string().max(2000).allow(''),
  coordinates: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
  }),
  doctorId: Joi.string().min(1).max(100),
  imageBase64: Joi.string().min(1).required(),
  mimeType: Joi.string().min(1).max(100).required(),
});

export const transcribeAudioSchema = Joi.object({
  audioBase64: Joi.string().min(1).required(),
  mimeType: Joi.string().min(1).max(100).default('audio/aac'),
});
