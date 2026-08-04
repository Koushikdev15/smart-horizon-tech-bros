import mongoose, { Schema, Document } from 'mongoose';

export interface IShipment extends Document {
  productId: mongoose.Types.ObjectId;
  originId: mongoose.Types.ObjectId;
  destinationId: mongoose.Types.ObjectId;
  status: 'In Transit' | 'Delivered' | 'Delayed';
  currentLocation?: string;
  fabricTxHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ShipmentSchema: Schema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    originId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    destinationId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['In Transit', 'Delivered', 'Delayed'], default: 'In Transit' },
    currentLocation: { type: String },
    fabricTxHash: { type: String },
  },
  { timestamps: true }
);

export const Shipment = mongoose.model<IShipment>('Shipment', ShipmentSchema);
