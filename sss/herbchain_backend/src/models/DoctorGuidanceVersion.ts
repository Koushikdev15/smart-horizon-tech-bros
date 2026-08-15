import mongoose, { Schema, Document } from 'mongoose';

export const GUIDANCE_STATUSES = ['DRAFT', 'SUBMITTED', 'PUBLISHED', 'REJECTED'] as const;
export type GuidanceStatus = typeof GUIDANCE_STATUSES[number];

/**
 * One immutable-once-submitted version of a DoctorGuidance's content. Never
 * overwritten after it leaves DRAFT — an edit to PUBLISHED guidance creates a
 * new version document with an incremented `version` number instead.
 */
export interface IDoctorGuidanceVersion extends Document {
  guidanceId: mongoose.Types.ObjectId;
  version: number;

  title: string;
  healthTopic: string;
  productId?: mongoose.Types.ObjectId;
  relevantIngredients: string[];
  description: string;
  traditionalContext?: string;
  recommendedUsage?: string;
  precautions?: string;
  contraindications?: string;
  interactions?: string;
  ageConsiderations?: string;
  specialPopulationWarnings?: string;
  whenToConsultDoctor?: string;

  region?: string;
  state?: string;
  district?: string;
  country?: string;
  language: 'en' | 'ta';
  references: string[];

  status: GuidanceStatus;
  createdBy: mongoose.Types.ObjectId;
  submittedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  publishedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const DoctorGuidanceVersionSchema: Schema = new Schema(
  {
    guidanceId: { type: Schema.Types.ObjectId, ref: 'DoctorGuidance', required: true },
    version: { type: Number, required: true },

    title: { type: String, required: true },
    healthTopic: { type: String, required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    relevantIngredients: { type: [String], default: [] },
    description: { type: String, required: true },
    traditionalContext: { type: String },
    recommendedUsage: { type: String },
    precautions: { type: String },
    contraindications: { type: String },
    interactions: { type: String },
    ageConsiderations: { type: String },
    specialPopulationWarnings: { type: String },
    whenToConsultDoctor: { type: String },

    region: { type: String },
    state: { type: String },
    district: { type: String },
    country: { type: String },
    language: { type: String, enum: ['en', 'ta'], default: 'en' },
    references: { type: [String], default: [] },

    status: { type: String, enum: GUIDANCE_STATUSES, default: 'DRAFT' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    submittedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

DoctorGuidanceVersionSchema.index({ guidanceId: 1, version: 1 }, { unique: true });

export const DoctorGuidanceVersion = mongoose.model<IDoctorGuidanceVersion>(
  'DoctorGuidanceVersion',
  DoctorGuidanceVersionSchema
);
