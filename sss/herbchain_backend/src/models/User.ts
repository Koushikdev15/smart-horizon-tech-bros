import mongoose, { Schema, Document } from 'mongoose';

export const USER_ROLES = [
  'Farmer', 'Wild Collector', 'Collection Center', 'Processing & Laboratory', 'Manufacturer', 'Supply Chain', 'Government',
  'Admin', 'Doctor', 'Customer', 'Pharmacy', 'Distributor',
] as const;

export type UserRole = typeof USER_ROLES[number];

export interface IUser extends Document {
  name: string;
  email: string;
  mobile: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;

  // Consumer profile fields — optional, populated for Customer accounts via
  // registration. Kept on User (rather than a join collection) since it's a
  // strict 1:1 relationship, mirroring the previous Supabase customer_profiles
  // shape. Government IDs are never stored in full — only the last 4 chars.
  language?: 'en' | 'ta';
  dateOfBirth?: Date;
  aadhaarLast4?: string;
  panLast4?: string;
  occupation?: string;
  religion?: string;
  region?: string;
  address?: string;
  coordinates?: { latitude: number; longitude: number };
  profilePhoto?: string;
  profileCompletion?: number;

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    mobile: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: USER_ROLES,
    },
    isActive: { type: Boolean, default: true },

    language: { type: String, enum: ['en', 'ta'], default: 'en' },
    dateOfBirth: { type: Date },
    aadhaarLast4: { type: String, match: /^[0-9]{4}$/ },
    panLast4: { type: String, match: /^[A-Z0-9]{4}$/ },
    occupation: { type: String },
    religion: { type: String },
    region: { type: String },
    address: { type: String },
    coordinates: {
      latitude: { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 },
    },
    profilePhoto: { type: String },
    profileCompletion: { type: Number, min: 0, max: 100, default: 0 },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
