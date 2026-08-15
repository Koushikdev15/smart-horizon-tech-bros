import Joi from 'joi';
import { COMPLAINT_ISSUE_TYPES, COMPLAINT_STATUSES } from '../models/Complaint';

export const submitComplaintSchema = Joi.object({
  issueType: Joi.string().valid(...COMPLAINT_ISSUE_TYPES).required(),
  description: Joi.string().min(3).required(),
  batchId: Joi.string().allow(''),
  productId: Joi.string().hex().length(24),
});

export const updateComplaintStatusSchema = Joi.object({
  status: Joi.string().valid(...COMPLAINT_STATUSES).required(),
  adminNotes: Joi.string().allow(''),
});
