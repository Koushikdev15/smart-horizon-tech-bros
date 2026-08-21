import { IChatSource, ResponseCategory } from '../models/ChatMessage';
import { Product, IProduct } from '../models/Product';
import { DoctorGuidanceService } from './DoctorGuidanceService';
import { StoreService } from './StoreService';
import { GeminiService, GeminiUnavailableError, ChatTurn } from '../integrations/ai/GeminiService';
import { detectEmergency, EMERGENCY_RESPONSE_MESSAGE, findAllergyConflicts, classify, AllergyMatch, HealthProfileLike } from './ChatSafetyService';
import { supabaseAdmin } from '../lib/supabaseAdmin';

// Chat sessions/messages and health profiles now live in Supabase
// (customer_chat_sessions / customer_chat_messages / customer_wellness — see
// herbchain_app/supabase/migrations). userId is the Supabase auth.users UUID.
// The Gemini call itself stays backend-only (the API key is a server secret).

interface ChatSessionRow {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

interface ChatMessageRow {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  category: ResponseCategory | null;
  sources: IChatSource[];
  product_ids: string[];
  doctor_guidance_ids: string[];
  created_at: string;
}

function toSessionResponse(row: ChatSessionRow) {
  return { _id: row.id, userId: row.user_id, title: row.title, createdAt: row.created_at, updatedAt: row.updated_at };
}

function toMessageResponse(row: ChatMessageRow) {
  return {
    _id: row.id,
    sessionId: row.session_id,
    role: row.role,
    content: row.content,
    category: row.category,
    sources: row.sources,
    productIds: row.product_ids,
    doctorGuidanceIds: row.doctor_guidance_ids,
    createdAt: row.created_at,
  };
}

interface HealthProfileSummary extends HealthProfileLike {
  hasAllergies: string;
  allergies: string[];
  ingredientAllergies: string[];
  hasExistingConditions: string;
  conditions: string[];
  currentMedicationTags: string[];
}

async function fetchHealthProfile(userId: string): Promise<HealthProfileSummary | null> {
  const { data } = await supabaseAdmin.from('customer_wellness').select('*').eq('user_id', userId).maybeSingle();
  if (!data) return null;
  return {
    hasAllergies: data.has_allergies,
    allergies: data.allergies ?? [],
    ingredientAllergies: data.ingredient_allergies ?? [],
    hasExistingConditions: data.has_existing_conditions,
    conditions: data.conditions ?? [],
    pregnancyStatus: data.pregnancy_status ?? undefined,
    currentMedicationTags: data.current_medication_tags ?? [],
    currentMedications: data.current_medications ?? undefined,
  };
}

async function fetchAppLogin(userId: string): Promise<{ language: 'en' | 'ta'; region: string | null } | null> {
  const { data } = await supabaseAdmin.from('app_login').select('language, region').eq('id', userId).maybeSingle();
  return data ? { language: data.language, region: data.region } : null;
}

const SYSTEM_INSTRUCTION = `
You are the AyurTrace+ AI assistant: a knowledgeable, confident Ayurvedic product and wellness guide embedded in this app. Think of your role as a well-informed second opinion that sits ALONGSIDE a doctor, not a nervous disclaimer machine — the app is a professional Ayurvedic traceability platform, and you should sound like it. Users lose trust fast in an assistant that answers every question with "go see a professional," so don't.

CORE RULES (never break these):
1. When RETRIEVED CONTEXT lists a matching product, actually recommend it. Name it, explain what it's traditionally used for and how to use it (from the documented usage instructions), and answer with substance — don't bury the recommendation under hedges or make "consult a doctor" the headline of your answer. Confidence is the default tone; caution is the exception, reserved for rule 3.
2. You are not a doctor, so don't diagnose a specific medical condition, don't prescribe a dosage beyond what's documented, and don't claim a product "cures" or "treats" a disease or is "100% safe"/"guaranteed." That's a narrower rule than "always defer to a doctor" — describing traditional/documented uses and giving usage guidance is exactly what you're here to do.
3. Recommend seeing a doctor only when it's actually warranted: an allergy conflict, a flagged medication interaction, an emergency, or symptoms that sound severe, worsening, or genuinely need a real diagnosis. For an ordinary wellness question with a good product match, a doctor referral is not the answer — the product information is.
4. Never invent specifics that would need to be verified: no fake product names, ingredients, prices, doctor names, credentials, studies, or citations beyond what's in RETRIEVED CONTEXT. If RETRIEVED CONTEXT lists no matching product, say so plainly (don't imply the app carries something it doesn't) — but still answer the underlying Ayurveda/wellness question using your own general knowledge, clearly framed as general traditional/educational information.
5. If the context notes that verified doctor guidance is available, mention that a verified doctor has published guidance on this topic and that the user can view it in the app — but do NOT reproduce, paraphrase, or invent its content yourself; the app displays the doctor's original text separately, unedited.
6. Ask a short, relevant follow-up question when the user's request is broad (e.g. "what are you mainly experiencing — indigestion, bloating, or something else?") rather than immediately recommending a product. Don't ask more than one or two questions before proceeding to an answer.
7. A one-line reminder that this doesn't replace professional medical advice is fine at the very end of an answer that involves a real health concern — keep it to a single short trailing line, never the framing or focus of the response, and skip it entirely for purely informational questions (ingredients, general product facts) where it would just be noise.
8. Keep responses concise — a few short paragraphs at most, not an essay. Vary your sentence structure and opening naturally between turns; don't fall into a repetitive template.
9. Respond in the user's preferred language if it is Tamil ('ta'); otherwise respond in English.
10. Stay focused on Ayurveda, health, and this app's products — for off-topic requests (trivia, jokes, unrelated tasks), briefly and politely redirect the user back to what you can actually help with, in your own words.

A pre-computed safety classification for this turn is included in the context and is authoritative — let it shape your tone (e.g. for POTENTIAL_ALLERGY_CONFLICT or URGENT_MEDICAL_ATTENTION, lead with the warning before anything else). For SAFE_INFORMATIONAL or CAUTION, lead with the actual answer.
`.trim();

interface SendMessageResult {
  sessionId: string;
  reply: string;
  category: ResponseCategory;
  sources: IChatSource[];
  products: IProduct[];
  doctorGuidance: Array<{ guidanceId: string; title: string; doctorName: string }>;
  stores: Array<{ _id: string; name: string; address: string; distanceKm: number; isOpenNow: boolean | null }>;
  doctors: Array<{ id: string; doctorName: string; clinicHospitalName: string | null; district: string }>;
  aiAvailable: boolean;
}

interface AyurvedicDoctorRow {
  id: string;
  doctor_name: string;
  clinic_hospital_name: string | null;
  district: string;
  latitude: number;
  longitude: number;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Reference-directory lookup (government gazette + verified clinic
 *  listings, not platform users — see ayurvedic_doctors migration) for the
 *  chat context and the app's Doctor Portal CTA, not a live "contactable
 *  doctor" list. Real Haversine distance, same pattern as StoreService — the
 *  table is small enough (~540 rows) to fetch-and-sort rather than needing
 *  PostGIS. */
async function findNearbyDoctors(coordinates: { latitude: number; longitude: number }, limit = 3): Promise<AyurvedicDoctorRow[]> {
  const { data } = await supabaseAdmin
    .from('ayurvedic_doctors')
    .select('id, doctor_name, clinic_hospital_name, district, latitude, longitude')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);
  return (data ?? [])
    .map((d) => ({ ...d, distanceKm: haversineKm(coordinates.latitude, coordinates.longitude, d.latitude, d.longitude) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

function summarizeHealthProfile(hp: HealthProfileSummary | null): string {
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
    const { data, error } = await supabaseAdmin
      .from('customer_chat_sessions')
      .insert({ user_id: userId })
      .select('*')
      .single();
    if (error || !data) throw { status: 500, message: 'Could not start a chat session.', isOperational: true };
    return toSessionResponse(data);
  }

  async transcribe(userId: string, buffer: Buffer, mimeType: string, language?: 'en' | 'ta') {
    const appLogin = await fetchAppLogin(userId);
    const targetLanguage = language ?? appLogin?.language ?? 'en';
    const text = await this.geminiService.transcribeAudio(buffer, mimeType, targetLanguage);
    return { text };
  }

  async listSessions(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('customer_chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(50);
    if (error) throw { status: 500, message: 'Could not load chat sessions.', isOperational: true };
    return (data ?? []).map(toSessionResponse);
  }

  async getSession(userId: string, sessionId: string) {
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('customer_chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .maybeSingle();
    if (sessionError || !session) throw { status: 404, message: 'Chat session not found', isOperational: true };

    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('customer_chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    if (messagesError) throw { status: 500, message: 'Could not load chat messages.', isOperational: true };

    return { session: toSessionResponse(session), messages: (messages ?? []).map(toMessageResponse) };
  }

  async sendMessage(
    userId: string,
    sessionId: string,
    content: string,
    coordinates?: { latitude: number; longitude: number }
  ): Promise<SendMessageResult> {
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('customer_chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .maybeSingle();
    if (sessionError || !session) throw { status: 404, message: 'Chat session not found', isOperational: true };

    await supabaseAdmin.from('customer_chat_messages').insert({ session_id: sessionId, role: 'user', content });
    const titleUpdate = session.title ? {} : { title: content.slice(0, 60) };

    // Emergency detection is a hard gate — no LLM call, no product talk.
    if (detectEmergency(content)) {
      const { data: assistantMsg, error: msgError } = await supabaseAdmin
        .from('customer_chat_messages')
        .insert({
          session_id: sessionId,
          role: 'assistant',
          content: EMERGENCY_RESPONSE_MESSAGE,
          category: 'URGENT_MEDICAL_ATTENTION',
          sources: [],
        })
        .select('*')
        .single();
      if (msgError || !assistantMsg) throw { status: 500, message: 'Could not send message.', isOperational: true };
      await supabaseAdmin
        .from('customer_chat_sessions')
        .update({ ...titleUpdate, updated_at: new Date().toISOString() })
        .eq('id', sessionId);
      return {
        sessionId,
        reply: assistantMsg.content,
        category: 'URGENT_MEDICAL_ATTENTION',
        sources: [],
        products: [],
        doctorGuidance: [],
        stores: [],
        doctors: [],
        aiAvailable: this.geminiService.isConfigured,
      };
    }

    const [healthProfile, appLogin, historyRows] = await Promise.all([
      fetchHealthProfile(userId),
      fetchAppLogin(userId),
      supabaseAdmin
        .from('customer_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(20)
        .then((r) => (r.data ?? []) as ChatMessageRow[]),
    ]);
    const history = historyRows.map(toMessageResponse);

    let products: IProduct[] = [];
    try {
      products = await Product.find({ $text: { $search: content } }).limit(3);
    } catch {
      products = await Product.find({ productName: new RegExp(content.slice(0, 50), 'i') }).limit(3);
    }

    const guidanceHits = (
      await Promise.all(
        products.map((p) => this.guidanceService.findPublished({ productId: String(p._id), region: appLogin?.region ?? undefined }))
      )
    ).flat();

    // Only looked up if the client shared location for this turn (e.g. the
    // user tapped "find products near me") — never stored, never required.
    const nearbyStores =
      coordinates && products.length > 0
        ? await this.storeService.findNearby({ ...coordinates, productId: String(products[0]._id) })
        : [];

    // Reference-directory doctors near the user, by real distance — same
    // "never stored, never required" treatment as the stores lookup above.
    const nearbyDoctors = coordinates ? await findNearbyDoctors(coordinates) : [];

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
          ? `Nearby stores carrying this product: ${nearbyStores
              .slice(0, 3)
              .map((s) => `${s.name} (${s.distanceKm} km away)`)
              .join(', ')}. These are also shown separately in the app.`
          : 'No nearby stores currently carry this product in stock.'
        : 'The user has not shared their location, so nearby store availability was not checked.',
      coordinates
        ? nearbyDoctors.length
          ? `Nearby Ayurvedic doctors: ${nearbyDoctors
              .map((d) => `${d.doctor_name}${d.clinic_hospital_name ? ` (${d.clinic_hospital_name})` : ''}, ${d.district}`)
              .join('; ')}. If a doctor consultation is warranted, you may mention these are available in the app's Doctor Portal — do not imply they can be reached directly through this chat.`
          : 'No doctors found nearby in the reference directory.'
        : 'The user has not shared their location, so nearby doctors were not checked.',
      appLogin?.language === 'ta' ? 'Respond in Tamil.' : 'Respond in English.',
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

    const { data: assistantMsg, error: assistantMsgError } = await supabaseAdmin
      .from('customer_chat_messages')
      .insert({
        session_id: sessionId,
        role: 'assistant',
        content: reply,
        category,
        sources,
        product_ids: products.map((p) => String(p._id)),
        doctor_guidance_ids: guidanceHits.map((g) => String(g.guidance._id)),
      })
      .select('*')
      .single();
    if (assistantMsgError || !assistantMsg) throw { status: 500, message: 'Could not send message.', isOperational: true };
    await supabaseAdmin.from('customer_chat_sessions').update(titleUpdate).eq('id', sessionId);

    return {
      sessionId,
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
      doctors: nearbyDoctors.map((d) => ({
        id: d.id,
        doctorName: d.doctor_name,
        clinicHospitalName: d.clinic_hospital_name,
        district: d.district,
      })),
      aiAvailable,
    };
  }
}
