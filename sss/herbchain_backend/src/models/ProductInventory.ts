import mongoose, { Schema, Document } from 'mongoose';

export interface IProductInventory extends Document {
  storeId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  available: boolean;
  quantity?: number;
  price?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductInventorySchema: Schema = new Schema(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    available: { type: Boolean, default: true },
    quantity: { type: Number, min: 0 },
    price: { type: Number, min: 0 },
  },
  { timestamps: true }
);

ProductInventorySchema.index({ storeId: 1, productId: 1 }, { unique: true });

export const ProductInventory = mongoose.model<IProductInventory>('ProductInventory', ProductInventorySchema);
