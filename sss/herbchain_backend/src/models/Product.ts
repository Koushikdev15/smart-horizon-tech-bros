import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  productName: string;
  batchIds: mongoose.Types.ObjectId[];
  manufacturerId: mongoose.Types.ObjectId;
  qrCode?: string;
  fabricTxHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    productName: { type: String, required: true },
    batchIds: [{ type: Schema.Types.ObjectId, ref: 'Batch', required: true }],
    manufacturerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    qrCode: { type: String },
    fabricTxHash: { type: String },
  },
  { timestamps: true }
);

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
