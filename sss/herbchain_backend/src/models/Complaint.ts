import mongoose, { Schema, Document } from 'mongoose';

export const COMPLAINT_STATUSES = ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'] as const;
export type ComplaintStatus = typeof COMPLAINT_STATUSES[number];

export const COMPLAINT_ISSUE_TYPES = [
  'QR not working',
  'Product details mismatch',
  'Suspicious packaging',
  'Suspicious seller',
  'Damaged product',
  'Incorrect information',
  'Other',
] as const;

export interface IComplaint extends Document {
  userId: mongoose.Types.ObjectId;
  productId?: mongoose.Types.ObjectId;
  batchId?: string;
  issueType: string;
  description: string;
  status: ComplaintStatus;
  adminNotes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ComplaintSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    batchId: { type: String },
    issueType: { type: String, enum: COMPLAINT_ISSUE_TYPES, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: COMPLAINT_STATUSES, default: 'OPEN' },
    adminNotes: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export const Complaint = mongoose.model<IComplaint>('Complaint', ComplaintSchema);
