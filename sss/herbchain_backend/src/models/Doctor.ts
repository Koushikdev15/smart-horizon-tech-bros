import mongoose, { Schema, Document } from 'mongoose';

export const DOCTOR_VERIFICATION_STATUSES = ['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED', 'REVOKED'] as const;
export type DoctorVerificationStatus = typeof DOCTOR_VERIFICATION_STATUSES[number];

export interface IDoctor extends Document {
  userId: mongoose.Types.ObjectId;

  name: string;
  qualification: string;
  specialization: string;
  registrationNumber: string;
  clinic: string;
  region: string;
  state: string;
  country: string;
  languages: string[];
  contactPhone?: string;
  contactEmail?: string;

  verificationStatus: DoctorVerificationStatus;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  /** Reason attached to the most recent REJECTED/SUSPENDED/REVOKED transition. */
  statusReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

const DoctorSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    name: { type: String, required: true },
    qualification: { type: String, required: true },
    specialization: { type: String, required: true },
    registrationNumber: { type: String, required: true, unique: true },
    clinic: { type: String, required: true },
    region: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    languages: { type: [String], default: [] },
    contactPhone: { type: String },
    contactEmail: { type: String },

    verificationStatus: { type: String, enum: DOCTOR_VERIFICATION_STATUSES, default: 'PENDING' },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    statusReason: { type: String },
  },
  { timestamps: true }
);

export const Doctor = mongoose.model<IDoctor>('Doctor', DoctorSchema);
