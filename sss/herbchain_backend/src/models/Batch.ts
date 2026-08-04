import mongoose, { Schema, Document } from 'mongoose';

export interface IBatch extends Document {
  collectionIds: mongoose.Types.ObjectId[];
  species: string;
  totalQuantity: number;
  centerId: mongoose.Types.ObjectId;
  fabricTxHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BatchSchema: Schema = new Schema(
  {
    collectionIds: [{ type: Schema.Types.ObjectId, ref: 'CollectionEvent', required: true }],
    species: { type: String, required: true },
    totalQuantity: { type: Number, required: true },
    centerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fabricTxHash: { type: String },
  },
  { timestamps: true }
);

export const Batch = mongoose.model<IBatch>('Batch', BatchSchema);
