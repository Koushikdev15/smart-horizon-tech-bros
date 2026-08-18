// Deterministic safety checks that run BEFORE any LLM call, per spec §5 ("The
// chatbot must identify potentially serious symptoms... do not attempt
// diagnosis") and §16 ("classify... do not expose internal technical labels
// unnecessarily"). None of this depends on the model — a keyword match here
// always wins over whatever the LLM would have said.

const EMERGENCY_PATTERNS: RegExp[] = [
  /chest pain/i,
  /(difficulty|trouble) breathing|can'?t breathe|shortness of breath/i,
  /severe allergic reaction|anaphylax/i,
  /loss of consciousness|passed out|unconscious|fainted/i,
  /severe bleeding|bleeding (heavily|a lot|won'?t stop)/i,
  /stroke|face (is )?drooping|slurred speech|sudden numbness/i,
  /severe (abdominal|stomach) pain/i,
  /suicid|self.?harm|kill myself|end my life|want to die/i,
];

export function detectEmergency(message: string): boolean {
  return EMERGENCY_PATTERNS.some((pattern) => pattern.test(message));
}

export const EMERGENCY_RESPONSE_MESSAGE =
  'These symptoms may require urgent medical attention. Please seek appropriate medical care immediately — ' +
  'contact your local emergency services or go to the nearest hospital. This chatbot cannot assess emergencies ' +
  'and will not attempt to.';

export interface Ingredient {
  name: string;
}

export interface ProductLike {
  ingredients: Ingredient[];
  contraindications?: string;
}

export interface HealthProfileLike {
  ingredientAllergies?: string[];
  currentMedications?: string;
  pregnancyStatus?: string;
}

export interface AllergyMatch {
  productIngredient: string;
  matchedAllergy: string;
}

/** Case-insensitive exact/substring match between a product's ingredients and the user's declared ingredient allergies. */
export function findAllergyConflicts(product: ProductLike, healthProfile: HealthProfileLike | null): AllergyMatch[] {
  if (!healthProfile?.ingredientAllergies?.length) return [];
  const allergies = healthProfile.ingredientAllergies.map((a) => a.toLowerCase().trim());

  const matches: AllergyMatch[] = [];
  for (const ingredient of product.ingredients) {
    const name = ingredient.name.toLowerCase().trim();
    const hit = allergies.find((a) => name.includes(a) || a.includes(name));
    if (hit) matches.push({ productIngredient: ingredient.name, matchedAllergy: hit });
  }
  return matches;
}

export type SafetyCategory = typeof import('../models/ChatMessage').RESPONSE_CATEGORIES[number];

/**
 * Picks the single most-severe category across everything retrieved for this
 * turn. Order matters — allergy conflicts always outrank a plain caution.
 */
export function classify(input: {
  hasEmergency: boolean;
  allergyConflicts: AllergyMatch[];
  hasMedicationNote: boolean;
  hasContraindicationNote: boolean;
  foundAnyContext: boolean;
}): SafetyCategory {
  if (input.hasEmergency) return 'URGENT_MEDICAL_ATTENTION';
  if (input.allergyConflicts.length > 0) return 'POTENTIAL_ALLERGY_CONFLICT';
  if (input.hasMedicationNote) return 'POTENTIAL_INTERACTION';
  if (input.hasContraindicationNote) return 'CAUTION';
  // No matching product in our ~30-item catalog does NOT mean the model has
  // nothing safe to say — with a narrow catalog this fires for most general
  // Ayurveda questions (e.g. "what helps with headaches"), and forcing an
  // "insufficient information" refusal for all of them made the assistant
  // useless outside the exact product list. General educational answers are
  // still safe; only the specific-product-grounding rule (never invent an
  // in-app product/ingredient/doctor that isn't in RETRIEVED CONTEXT) needs
  // foundAnyContext to matter, and that's enforced in the prompt, not here.
  return 'SAFE_INFORMATIONAL';
}
