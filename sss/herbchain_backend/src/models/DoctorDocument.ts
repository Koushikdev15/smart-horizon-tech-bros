import mongoose, { Schema, Document } from 'mongoose';

export const DOCTOR_DOCUMENT_TYPES = ['license', 'certification', 'profile_photo', 'other'] as const;
export type DoctorDocumentType = typeof DOCTOR_DOCUMENT_TYPES[number];

export interface IDoctorDocument extends Document {
  doctorId: mongoose.Types.ObjectId;
  type: DoctorDocumentType;
  fileName: string;
  mimeType: string;
  /** Storage reference (IPFS CID today — see IpfsService for its current mock status). */
  storageRef: string;
  uploadedAt: Date;
}

const DoctorDocumentSchema: Schema = new Schema({
  doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  type: { type: String, enum: DOCTOR_DOCUMENT_TYPES, required: true },
  fileName: { type: String, required: true },
  mimeType: { type: String, required: true },
  storageRef: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

export const DoctorDocument = mongoose.model<IDoctorDocument>('DoctorDocument', DoctorDocumentSchema);
