import mongoose, { Schema, Document } from 'mongoose';

export const RESPONSE_CATEGORIES = [
  'SAFE_INFORMATIONAL',
  'CAUTION',
  'POTENTIAL_ALLERGY_CONFLICT',
  'POTENTIAL_INTERACTION',
  'MEDICAL_CONSULTATION_RECOMMENDED',
  'URGENT_MEDICAL_ATTENTION',
  'INSUFFICIENT_INFORMATION',
] as const;
export type ResponseCategory = typeof RESPONSE_CATEGORIES[number];

export interface IChatSource {
  type: 'product' | 'doctor_guidance';
  id: string;
  label: string;
}

export interface IChatMessage extends Document {
  sessionId: mongoose.Types.ObjectId;
  role: 'user' | 'assistant';
  content: string;
  /** Only set on assistant messages — the internal safety classification (see spec §16). */
  category?: ResponseCategory;
  sources: IChatSource[];
  productIds: mongoose.Types.ObjectId[];
  doctorGuidanceIds: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const ChatMessageSchema: Schema = new Schema(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'ChatSession', required: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    category: { type: String, enum: RESPONSE_CATEGORIES },
    sources: [
      {
        type: { type: String, enum: ['product', 'doctor_guidance'], required: true },
        id: { type: String, required: true },
        label: { type: String, required: true },
      },
    ],
    productIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    doctorGuidanceIds: [{ type: Schema.Types.ObjectId, ref: 'DoctorGuidance' }],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ChatMessageSchema.index({ sessionId: 1, createdAt: 1 });

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
