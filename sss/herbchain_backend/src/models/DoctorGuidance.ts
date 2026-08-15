import mongoose, { Schema, Document } from 'mongoose';

/**
 * The stable identity of a piece of doctor guidance. Content itself lives in
 * DoctorGuidanceVersion — editing published guidance creates a new version
 * rather than mutating history (see DoctorGuidanceVersion / spec section 13).
 */
export interface IDoctorGuidance extends Document {
  doctorId: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  healthTopic: string;
  currentPublishedVersion?: mongoose.Types.ObjectId;
  latestVersionNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

const DoctorGuidanceSchema: Schema = new Schema(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    healthTopic: { type: String, required: true },
    currentPublishedVersion: { type: Schema.Types.ObjectId, ref: 'DoctorGuidanceVersion' },
    latestVersionNumber: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const DoctorGuidance = mongoose.model<IDoctorGuidance>('DoctorGuidance', DoctorGuidanceSchema);
