import mongoose, { Schema, Document } from 'mongoose';

export interface IProductIngredient {
  name: string;
  scientificName?: string;
}

export interface IProduct extends Document {
  productName: string;
  batchIds: mongoose.Types.ObjectId[];
  manufacturerId: mongoose.Types.ObjectId;
  qrCode?: string;
  fabricTxHash?: string;

  // Ayurvedic-product content — used by the chatbot's RAG retrieval and
  // allergy/ingredient safety checking (matched against HealthProfile
  // allergies/ingredientAllergies by name).
  ingredients: IProductIngredient[];
  /** Documented traditional uses/topics this product is relevant to, e.g. ["Digestion", "Stress"]. */
  healthTopics: string[];
  description?: string;
  usageInstructions?: string;
  precautions?: string;
  contraindications?: string;

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

    ingredients: [
      {
        name: { type: String, required: true },
        scientificName: { type: String },
      },
    ],
    healthTopics: { type: [String], default: [] },
    description: { type: String },
    usageInstructions: { type: String },
    precautions: { type: String },
    contraindications: { type: String },
  },
  { timestamps: true }
);

ProductSchema.index({ productName: 'text', healthTopics: 'text', 'ingredients.name': 'text' });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
