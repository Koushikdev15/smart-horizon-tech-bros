import { apiRequest } from '@/lib/api';

export type SuitabilityVerdict = 'NO_KNOWN_CONFLICT' | 'POTENTIAL_CONCERN' | 'HIGH_RISK_MATCH' | 'INSUFFICIENT_INFORMATION';

export interface SuitabilityResult {
  product: {
    _id: string;
    productName: string;
    ingredients: { name: string; scientificName?: string }[];
    healthTopics: string[];
    description?: string;
    usageInstructions?: string;
    precautions?: string;
    contraindications?: string;
  };
  verdict: SuitabilityVerdict;
  verdictLabel: string;
  explanation: string;
  riskScore: number;
  riskBand: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH';
  allergyConflicts: { productIngredient: string; matchedAllergy: string }[];
  hasHealthProfile: boolean;
  doctorGuidance: { guidanceId: string; title: string; doctorName: string }[];
}

export interface SustainabilityResult {
  product: { _id: string; productName: string };
  score: number;
  breakdown: {
    ingredientTraceability: number;
    documentationCompleteness: number;
    storeCoverage: number;
    qrTraceability: number;
  };
  storeCount: number;
  totalIngredients: number;
  tracedIngredients: number;
}

export const productService = {
  async checkSuitability(identifier: { productId?: string; productName?: string }): Promise<SuitabilityResult> {
    return apiRequest('/products/suitability', {
      method: 'POST',
      body: JSON.stringify(identifier),
    });
  },

  async getSustainability(identifier: { productId?: string; productName?: string }): Promise<SustainabilityResult> {
    return apiRequest('/products/sustainability', {
      method: 'POST',
      body: JSON.stringify(identifier),
    });
  },
};
