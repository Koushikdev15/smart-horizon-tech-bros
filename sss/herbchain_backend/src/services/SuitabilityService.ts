import { IProduct } from '../models/Product';
import { ProductService } from './ProductService';
import { DoctorGuidanceService } from './DoctorGuidanceService';
import { findAllergyConflicts, AllergyMatch, HealthProfileLike } from './ChatSafetyService';
import { supabaseAdmin } from '../lib/supabaseAdmin';

// Health profiles now live in Supabase (public.customer_wellness) — see
// herbchain_app/supabase/migrations/0005_customer_wellness.sql. userId is the
// Supabase auth.users UUID.
async function fetchHealthProfile(userId: string): Promise<HealthProfileLike | null> {
  const { data } = await supabaseAdmin.from('customer_wellness').select('*').eq('user_id', userId).maybeSingle();
  if (!data) return null;
  return {
    ingredientAllergies: data.ingredient_allergies ?? [],
    currentMedications: data.current_medications ?? undefined,
    pregnancyStatus: data.pregnancy_status ?? undefined,
  };
}

async function fetchRegion(userId: string): Promise<string | undefined> {
  const { data } = await supabaseAdmin.from('app_login').select('region').eq('id', userId).maybeSingle();
  return data?.region ?? undefined;
}

// Deliberately a separate, narrower vocabulary from the chatbot's internal
// ResponseCategory — this is the direct product-suitability check from spec
// §6, which explicitly avoids absolute language ("100% safe") in favor of:
// "No known conflict detected / Potential concern / High-risk match /
// Insufficient information."
export type SuitabilityVerdict = 'NO_KNOWN_CONFLICT' | 'POTENTIAL_CONCERN' | 'HIGH_RISK_MATCH' | 'INSUFFICIENT_INFORMATION';

const VERDICT_LABELS: Record<SuitabilityVerdict, string> = {
  NO_KNOWN_CONFLICT: 'No known conflict detected',
  POTENTIAL_CONCERN: 'Potential concern',
  HIGH_RISK_MATCH: 'High-risk match',
  INSUFFICIENT_INFORMATION: 'Insufficient information',
};

function buildExplanation(
  verdict: SuitabilityVerdict,
  product: IProduct,
  allergyConflicts: AllergyMatch[]
): string {
  if (verdict === 'HIGH_RISK_MATCH') {
    const allergens = [...new Set(allergyConflicts.map((c) => c.matchedAllergy))].join(', ');
    return (
      `Your health profile indicates an allergy to ${allergens}, which is an ingredient in ${product.productName}. ` +
      `Avoid using this product and consult a qualified healthcare professional.`
    );
  }
  if (verdict === 'POTENTIAL_CONCERN') {
    return (
      `${product.productName} has a documented contraindication on file: "${product.contraindications}". ` +
      `Review this against your health profile and consult a doctor if you're unsure.`
    );
  }
  if (verdict === 'INSUFFICIENT_INFORMATION') {
    return "We don't have enough verified ingredient or health-profile information to assess this product's suitability safely.";
  }
  return (
    `No recorded ingredient allergy in your health profile matches ${product.productName}'s listed ingredients. ` +
    `This is not a guarantee of safety for every individual — consult a doctor if you have concerns.`
  );
}

export class SuitabilityService {
  private productService = new ProductService();
  private guidanceService = new DoctorGuidanceService();

  async check(userId: string, identifier: { productId?: string; productName?: string }) {
    const product = await this.productService.resolve(identifier);
    const [healthProfile, region] = await Promise.all([fetchHealthProfile(userId), fetchRegion(userId)]);

    const allergyConflicts = findAllergyConflicts(product, healthProfile);
    const hasIngredientData = product.ingredients.length > 0;

    let verdict: SuitabilityVerdict;
    if (allergyConflicts.length > 0) {
      verdict = 'HIGH_RISK_MATCH';
    } else if (!hasIngredientData && !healthProfile) {
      verdict = 'INSUFFICIENT_INFORMATION';
    } else if (product.contraindications) {
      verdict = 'POTENTIAL_CONCERN';
    } else {
      verdict = 'NO_KNOWN_CONFLICT';
    }

    const guidance = await this.guidanceService.findPublished({ productId: String(product._id), region });

    return {
      product,
      verdict,
      verdictLabel: VERDICT_LABELS[verdict],
      explanation: buildExplanation(verdict, product, allergyConflicts),
      allergyConflicts,
      hasHealthProfile: Boolean(healthProfile),
      doctorGuidance: guidance.map((g) => ({
        guidanceId: String(g.guidance._id),
        title: g.version.title,
        doctorName: g.doctor.name,
      })),
    };
  }
}
