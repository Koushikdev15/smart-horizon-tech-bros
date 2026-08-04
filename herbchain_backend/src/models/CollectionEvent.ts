import mongoose, { Schema, Document } from 'mongoose';

export interface ICollectionEvent extends Document {
  farmerId: mongoose.Types.ObjectId;
  species: string;
  quantity: number;
  latitude: number;
  longitude: number;
  ipfsImageCid: string;
  fabricTxHash?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: Date;
  updatedAt: Date;
}

const CollectionEventSchema: Schema = new Schema(
  {
    farmerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    species: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0.1 },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    ipfsImageCid: { type: String, required: true },
    fabricTxHash: { type: String },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  },
  { timestamps: true }
);

export const CollectionEvent = mongoose.model<ICollectionEvent>('CollectionEvent', CollectionEventSchema);
