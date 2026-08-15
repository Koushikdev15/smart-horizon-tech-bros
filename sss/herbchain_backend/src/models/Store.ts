import mongoose, { Schema, Document } from 'mongoose';

export interface IStore extends Document {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  storeType: 'Pharmacy' | 'Ayurvedic Store' | 'Distributor Outlet' | 'Other';
  address: string;
  region: string;
  state: string;
  country: string;
  /** GeoJSON Point — [longitude, latitude], per MongoDB's convention (reversed from the usual lat/lng order). */
  location: { type: 'Point'; coordinates: [number, number] };
  phone?: string;
  /** "HH:MM" 24-hour, compared against server local time — see StoreService.isOpenNow(). */
  openTime?: string;
  closeTime?: string;
  is24Hours: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StoreSchema: Schema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    storeType: { type: String, enum: ['Pharmacy', 'Ayurvedic Store', 'Distributor Outlet', 'Other'], default: 'Pharmacy' },
    address: { type: String, required: true },
    region: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    phone: { type: String },
    openTime: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    closeTime: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    is24Hours: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

StoreSchema.index({ location: '2dsphere' });

export const Store = mongoose.model<IStore>('Store', StoreSchema);
