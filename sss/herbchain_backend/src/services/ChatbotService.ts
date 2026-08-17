import { ChatSession } from '../models/ChatSession';
import { ChatMessage, IChatSource, ResponseCategory } from '../models/ChatMessage';
import { HealthProfile, IHealthProfile } from '../models/HealthProfile';
import { User } from '../models/User';
import { Product, IProduct } from '../models/Product';
import { DoctorGuidanceService } from './DoctorGuidanceService';
import { StoreService } from './StoreService';
import { GeminiService, GeminiUnavailableError, ChatTurn } from '../integrations/ai/GeminiService';
import { detectEmergency, EMERGENCY_RESPONSE_MESSAGE, findAllergyConflicts, classify, AllergyMatch } from './ChatSafetyService';

const SYSTEM_INSTRUCTION = `
You are the AyurTrace+ AI assistant, embedded in an Ayurvedic botanical traceability app.

CORE RULES (never break these):
1. You are NOT a doctor. Never diagnose a condition, never prescribe a specific dosage or treatment, never claim a product will "cure" or "treat" a disease, and never claim a product is "100% safe" or "guaranteed."
2. Only use the facts given to you in the "RETRIEVED CONTEXT" section of the user's message. Never invent product names, ingredients, doctor names, credentials, studies, or citations. If the retrieved context doesn't answer the question, tell the user in your own words, varied naturally each time, that you don't have enough verified information to answer that safely — don't repeat a fixed template sentence.
3. If the context notes that verified doctor guidance is available, mention that a verified doctor has published guidance on this topic and that the user can view it in the app — but do NOT reproduce, paraphrase, or invent its content yourself; the app displays the doctor's original text separately, unedited.
4. Ask a short, relevant follow-up question when the user's request is broad (e.g. "what are you mainly experiencing — indigestion, bloating, or something else?") rather than immediately recommending a product. Don't ask more than one or two questions before proceeding to an answer.
5. Always end product-related answers with a brief reminder that this information does not replace professional medical advice.
6. Keep responses concise — a few short paragraphs at most, not an essay. Vary your sentence structure and opening naturally between turns; don't fall into a repetitive template.
7. Respond in the user's preferred language if it is Tamil ('ta'); otherwise respond in English.
8. Stay focused on Ayurveda, health, and this app's products — for off-topic requests (trivia, jokes, unrelated tasks), briefly and politely redirect the user back to what you can actually help with, in your own words.

A pre-computed safety classification for this turn is included in the context and is authoritative — let it shape your tone (e.g. for POTENTIAL_ALLERGY_CONFLICT, lead with the warning before anything else; for INSUFFICIENT_INFORMATION, say so rather than guessing).
`.trim();

interface SendMessageResult {
  sessionId: string;
  reply: string;
  category: ResponseCategory;
  sources: IChatSource[];
  products: IProduct[];
  doctorGuidance: Array<{ guidanceId: string; title: string; doctorName: string }>;
  stores: Array<{ _id: string; name: string; address: string; distanceKm: number; isOpenNow: boolean | null }>;
  aiAvailable: boolean;
}

function summarizeHealthProfile(hp: IHealthProfile | null): string {
  if (!hp) return 'No health profile on file.';
  const parts: string[] = [];
  parts.push(`allergies: ${hp.hasAllergies}${hp.allergies.length ? ` (${hp.allergies.join(', ')})` : ''}`);
  if (hp.ingredientAllergies.length) parts.push(`known ingredient allergies: ${hp.ingredientAllergies.join(', ')}`);
  parts.push(`existing conditions: ${hp.hasExistingConditions}${hp.conditions.length ? ` (${hp.conditions.join(', ')})` : ''}`);
  if (hp.pregnancyStatus && hp.pregnancyStatus !== 'undisclosed') parts.push(`pregnancy status: ${hp.pregnancyStatus}`);
  if (hp.currentMedicationTags.length) parts.push(`current medication categories: ${hp.currentMedicationTags.join(', ')}`);
  if (hp.currentMedications) parts.push('additional medication details on file (withheld from AI context for privacy)');
  return parts.join('; ');
}

function describeProduct(p: IProduct): string {
  const ingredients = p.ingredients.map((i) => i.name).join(', ') || 'not listed';
  return (
    `Product "${p.productName}" — ingredients: ${ingredients}; documented uses: ${p.healthTopics.join(', ') || 'not listed'}; ` +
    `usage: ${p.usageInstructions || 'not documented'}; precautions: ${p.precautions || 'none documented'}; ` +
    `contraindications: ${p.contraindications || 'none documented'}.`
  );
}

function buildFallbackReply(
  category: ResponseCategory,
  products: IProduct[],
  allergyConflicts: AllergyMatch[],
  guidanceAvailable: boolean
): string {
  const lines: string[] = [];
  if (category === 'POTENTIAL_ALLERGY_CONFLICT') {
    lines.push(
      `Your health profile lists an allergy to ${allergyConflicts.map((c) => c.matchedAllergy).join(', ')}, ` +
        `which matches an ingredient in a product that came up for your request. Avoid it and consult a qualified healthcare professional.`
    );
  } else if (products.length) {
    lines.push(`I found ${products.length} verified product${products.length > 1 ? 's' : ''} that may be relevant: ${products.map((p) => p.productName).join(', ')}.`);
  } else {
    lines.push("I don't have enough verified information to answer that safely yet.");
  }
  if (guidanceAvailable) lines.push('Verified doctor guidance is available on this topic — see the guidance card below.');
  lines.push('(AI-generated explanation is temporarily unavailable, so this is a direct summary of verified data only.)');
  lines.push('This information does not replace professional medical advice.');
  return lines.join(' ');
}

export class ChatbotService {
  private guidanceService = new DoctorGuidanceService();
  private storeService = new StoreService();
  private geminiService = new GeminiService();

  async createSession(userId: string) {
    return ChatSession.create({ userId });
  }

  async listSessions(userId: string) {
    return ChatSession.find({ userId }).sort({ updatedAt: -1 }).limit(50);
  }

  async getSession(userId: string, sessionId: string) {
    const session = await ChatSession.findOne({ _id: sessionId, userId });
    if (!session) throw { status: 404, message: 'Chat session not found', isOperational: true };
    const messages = await ChatMessage.find({ sessionId }).sort({ createdAt: 1 });
    return { session, messages };
  }

  async sendMessage(
    userId: string,
    sessionId: string,
    content: string,
    coordinates?: { latitude: number; longitude: number }
  ): Promise<SendMessageResult> {
    const session = await ChatSession.findOne({ _id: sessionId, userId });
    if (!session) throw { status: 404, message: 'Chat session not found', isOperational: true };

    await ChatMessage.create({ sessionId, role: 'user', content });
    if (!session.title) session.title = content.slice(0, 60);

    // Emergency detection is a hard gate — no LLM call, no product talk.
    if (detectEmergency(content)) {
      const assistantMsg = await ChatMessage.create({
        sessionId,
        role: 'assistant',
        content: EMERGENCY_RESPONSE_MESSAGE,
        category: 'URGENT_MEDICAL_ATTENTION',
        sources: [],
      });
      await session.save();
      return {
        sessionId: String(session._id),
        reply: assistantMsg.content,
        category: 'URGENT_MEDICAL_ATTENTION',
        sources: [],
        products: [],
        doctorGuidance: [],
        stores: [],
        aiAvailable: this.geminiService.isConfigured,
      };
    }

    const [healthProfile, user, history] = await Promise.all([
      HealthProfile.findOne({ userId }),
      User.findById(userId),
      ChatMessage.find({ sessionId }).sort({ createdAt: 1 }).limit(20),
    ]);

    let products: IProduct[] = [];
    try {
      products = await Product.find({ $text: { $search: content } }).limit(3);
    } catch {
      products = await Product.find({ productName: new RegExp(content.slice(0, 50), 'i') }).limit(3);
    }

    const guidanceHits = (
      await Promise.all(products.map((p) => this.guidanceService.findPublished({ productId: String(p._id), region: user?.region })))
    ).flat();

    // Only looked up if the client shared location for this turn (e.g. the
    // user tapped "find products near me") — never stored, never required.
    const nearbyStores =
      coordinates && products.length > 0
        ? await this.storeService.findNearby({ ...coordinates, productId: String(products[0]._id) })
        : [];

    const allergyConflicts = products.flatMap((p) => findAllergyConflicts(p, healthProfile));
    const hasContraindicationNote = products.some((p) => Boolean(p.contraindications));
    const hasMedicationNote =
      (Boolean(healthProfile?.currentMedications) || (healthProfile?.currentMedicationTags.length ?? 0) > 0) &&
      products.length > 0;
    const foundAnyContext = products.length > 0 || guidanceHits.length > 0;

    const category = classify({
      hasEmergency: false,
      allergyConflicts,
      hasMedicationNote,
      hasContraindicationNote,
      foundAnyContext,
    });

    const sources: IChatSource[] = [
      ...products.map((p) => ({ type: 'product' as const, id: String(p._id), label: p.productName })),
      ...guidanceHits.map((g) => ({ type: 'doctor_guidance' as const, id: String(g.guidance._id), label: g.version.title })),
    ];

    const contextBlock = [
      'RETRIEVED CONTEXT (only source of truth — do not add facts beyond this):',
      `Safety classification for this turn: ${category}`,
      `User health profile summary: ${summarizeHealthProfile(healthProfile)}`,
      allergyConflicts.length
        ? `ALLERGY CONFLICT DETECTED: product ingredient(s) ${allergyConflicts.map((c) => c.productIngredient).join(', ')} match the user's declared allergy to ${allergyConflicts.map((c) => c.matchedAllergy).join(', ')}.`
        : 'No ingredient-level allergy conflict detected against the user\'s health profile.',
      products.length
        ? products.map(describeProduct).join('\n')
        : 'No matching products were found in the verified product database for this request.',
      guidanceHits.length
        ? `Verified doctor guidance is available for: ${guidanceHits.map((g) => `"${g.version.title}" by Dr. ${g.doctor.name}`).join('; ')}.`
        : 'No verified doctor guidance is available on this topic yet.',
      coordinates
        ? nearbyStores.length
          ? `Nearby stores carrying this product are available (shown separately in the app) — you may mention that nearby availability was found.`
          : 'No nearby stores currently carry this product in stock.'
        : 'The user has not shared their location, so nearby store availability was not checked.',
      user?.language === 'ta' ? 'Respond in Tamil.' : 'Respond in English.',
    ].join('\n');

    const turns: ChatTurn[] = history.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));
    turns.push({ role: 'user', content: `${contextBlock}\n\nUser message: ${content}` });

    let reply: string;
    let aiAvailable = true;
    try {
      reply = await this.geminiService.generateReply(SYSTEM_INSTRUCTION, turns);
    } catch (err) {
      if (!(err instanceof GeminiUnavailableError)) throw err;
      aiAvailable = false;
      reply = buildFallbackReply(category, products, allergyConflicts, guidanceHits.length > 0);
    }

    const assistantMsg = await ChatMessage.create({
      sessionId,
      role: 'assistant',
      content: reply,
      category,
      sources,
      productIds: products.map((p) => p._id),
      doctorGuidanceIds: guidanceHits.map((g) => g.guidance._id),
    });
    await session.save();

    return {
      sessionId: String(session._id),
      reply: assistantMsg.content,
      category,
      sources,
      products,
      doctorGuidance: guidanceHits.map((g) => ({
        guidanceId: String(g.guidance._id),
        title: g.version.title,
        doctorName: g.doctor.name,
      })),
      stores: nearbyStores.map((s) => ({
        _id: String(s._id),
        name: s.name,
        address: s.address,
        distanceKm: s.distanceKm,
        isOpenNow: s.isOpenNow,
      })),
      aiAvailable,
    };
  }
}
