import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  actorId: mongoose.Types.ObjectId;
  action: string;
  targetType: string;
  /** A Mongo ObjectId for Mongo-backed entities, or a Supabase UUID string
   *  for entities that now live in Supabase (Complaint, Order, ...). */
  targetId: mongoose.Types.ObjectId | string;
  previousStatus?: string;
  newStatus?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: Schema.Types.Mixed, required: true },
    previousStatus: { type: String },
    newStatus: { type: String },
    reason: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ targetType: 1, targetId: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
