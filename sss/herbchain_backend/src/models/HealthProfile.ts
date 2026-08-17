import mongoose, { Schema, Document } from 'mongoose';

export type TriState = 'no' | 'yes' | 'undisclosed';
export type PregnancyStatus = 'not_applicable' | 'pregnant' | 'breastfeeding' | 'planning' | 'undisclosed';

export interface IHealthProfile extends Document {
  userId: mongoose.Types.ObjectId;

  hasAllergies: TriState;
  allergies: string[];
  allergyNotes?: string;
  /** Structured ingredient/allergen names, matched against Product.ingredients for suitability checks. */
  ingredientAllergies: string[];

  hasCurrentHealthIssues: TriState;
  currentHealthIssues?: string;

  hasExistingConditions: TriState;
  conditions: string[];

  /** Quick-select category tags — "points" in the UI; the string fields below hold the free-text paragraph. */
  medicalHistoryTags: string[];
  medicalHistory?: string;
  currentMedicationTags: string[];
  currentMedications?: string;
  previousAdverseReactions?: string;

  pregnancyStatus: PregnancyStatus;
  dietaryPreferences: string[];
  ayurvedicPreferences: string[];

  consentStoreHealthData: boolean;
  consentPersonalizedAlerts: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const TRI_STATE_VALUES: TriState[] = ['no', 'yes', 'undisclosed'];

const HealthProfileSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    hasAllergies: { type: String, enum: TRI_STATE_VALUES, default: 'undisclosed' },
    allergies: { type: [String], default: [] },
    allergyNotes: { type: String },
    ingredientAllergies: { type: [String], default: [] },

    hasCurrentHealthIssues: { type: String, enum: TRI_STATE_VALUES, default: 'undisclosed' },
    currentHealthIssues: { type: String },

    hasExistingConditions: { type: String, enum: TRI_STATE_VALUES, default: 'undisclosed' },
    conditions: { type: [String], default: [] },

    medicalHistoryTags: { type: [String], default: [] },
    medicalHistory: { type: String },
    currentMedicationTags: { type: [String], default: [] },
    currentMedications: { type: String },
    previousAdverseReactions: { type: String },

    pregnancyStatus: {
      type: String,
      enum: ['not_applicable', 'pregnant', 'breastfeeding', 'planning', 'undisclosed'],
      default: 'undisclosed',
    },
    dietaryPreferences: { type: [String], default: [] },
    ayurvedicPreferences: { type: [String], default: [] },

    consentStoreHealthData: { type: Boolean, default: false },
    consentPersonalizedAlerts: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const HealthProfile = mongoose.model<IHealthProfile>('HealthProfile', HealthProfileSchema);
