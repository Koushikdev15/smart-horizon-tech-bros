import { IProduct } from '../models/Product';
import { HealthProfile } from '../models/HealthProfile';
import { ProductService } from './ProductService';
import { DoctorGuidanceService } from './DoctorGuidanceService';
import { findAllergyConflicts, AllergyMatch } from './ChatSafetyService';
import { User } from '../models/User';

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
    const [healthProfile, user] = await Promise.all([HealthProfile.findOne({ userId }), User.findById(userId)]);

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

    const guidance = await this.guidanceService.findPublished({ productId: String(product._id), region: user?.region });

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
