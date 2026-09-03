import { IChatSource, ResponseCategory } from '../models/ChatMessage';
import { Product, IProduct } from '../models/Product';
import { DoctorGuidanceService } from './DoctorGuidanceService';
import { StoreService } from './StoreService';
import { GeminiService, GeminiUnavailableError, ChatTurn } from '../integrations/ai/GeminiService';
import {
  detectEmergency,
  EMERGENCY_RESPONSE_MESSAGE,
  findAllergyConflicts,
  classify,
  hasRelevantContraindication,
  hasRelevantMedicationInteraction,
  AllergyMatch,
  HealthProfileLike,
} from './ChatSafetyService';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import logger from '../utils/logger';

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

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  ta: 'Tamil',
  hi: 'Hindi',
  kn: 'Kannada',
  te: 'Telugu',
  tcy: 'Tulu',
};

async function fetchAppLogin(userId: string): Promise<{ language: string; region: string | null } | null> {
  const { data } = await supabaseAdmin.from('app_login').select('language, region').eq('id', userId).maybeSingle();
  return data ? { language: data.language, region: data.region } : null;
}

const SYSTEM_INSTRUCTION = `
You are the AyurTrace+ AI assistant: a knowledgeable, confident Ayurvedic product and wellness guide embedded in this app. Think of your role as a well-informed second opinion that sits ALONGSIDE a doctor, not a nervous disclaimer machine — the app is a professional Ayurvedic traceability platform, and you should sound like it. Users lose trust fast in an assistant that answers every question with "go see a professional," so don't.

CORE RULES (never break these):
1. When RETRIEVED CONTEXT lists a matching product, actually recommend it. Name it, explain what it's traditionally used for and how to use it (from the documented usage instructions), and answer with substance — don't bury the recommendation under hedges or make "consult a doctor" the headline of your answer. Confidence is the default tone; caution is the exception, reserved for rule 3.
2. You are not a doctor, so don't diagnose a specific medical condition, don't prescribe a dosage beyond what's documented, and don't claim a product "cures" or "treats" a disease or is "100% safe"/"guaranteed." That's a narrower rule than "always defer to a doctor" — describing traditional/documented uses and giving usage guidance is exactly what you're here to do.
3. Do not recommend seeing a doctor in every reply — it should be the exception, not a habit. Two situations warrant it: (a) the user is explicitly asking what to take/do for a specific symptom or condition (a real treatment-seeking question) — in that case, still lead with the actual product/wellness data in full, and simply add that AyurTrace+ has verified Ayurvedic doctors in the Doctor Portal if they'd like personalized guidance, as a normal closing option, not a warning; (b) an allergy conflict, a flagged medication interaction, an emergency, or symptoms that sound severe/worsening/genuinely need a real diagnosis — here the doctor mention is a real caution, not just an option. For anything else — general informational questions, ingredient/product facts, casual conversation, greetings — never mention a doctor at all. When you do mention one, never phrase it as a generic outside referral like "consult a certified doctor" or "see a healthcare professional" — phrase it as AyurTrace+'s own verified Ayurvedic doctors in the Doctor Portal, pointing to a real feature in this app rather than a vague outside action.
4. Never invent specifics that would need to be verified: no fake product names, ingredients, prices, doctor names, credentials, studies, or citations beyond what's in RETRIEVED CONTEXT. If RETRIEVED CONTEXT lists no matching product, say so plainly (don't imply the app carries something it doesn't) — but still answer the underlying Ayurveda/wellness question using your own general knowledge, clearly framed as general traditional/educational information.
5. If the context notes that verified doctor guidance is available, mention that a verified doctor has published guidance on this topic and that the user can view it in the app — but do NOT reproduce, paraphrase, or invent its content yourself; the app displays the doctor's original text separately, unedited.
6. Ask a short, relevant follow-up question when the user's request is broad (e.g. "what are you mainly experiencing — indigestion, bloating, or something else?") rather than immediately recommending a product. Don't ask more than one or two questions before proceeding to an answer.
7. A one-line reminder that this doesn't replace professional medical advice is fine at the very end of an answer that involves a real health concern — keep it to a single short trailing line, never the framing or focus of the response, and skip it entirely for purely informational questions (ingredients, general product facts) where it would just be noise.
8. Keep responses concise — a few short paragraphs at most, not an essay. Vary your sentence structure and opening naturally between turns; don't fall into a repetitive template.
9. Detect which language the user's current message is written/spoken in — English, Tamil, Hindi, Kannada, Telugu, or Tulu — and respond in that same language and script (Tulu, if that's what the user wrote, in Kannada script, the common digital convention). If a message mixes languages or is ambiguous, fall back to the account's stored preferred language noted in the context below. Don't ask the user which language to use — just match what they actually wrote.
10. Stay focused on Ayurveda, health, and this app's products — for off-topic requests (trivia, jokes, unrelated tasks), briefly and politely redirect the user back to what you can actually help with, in your own words.
11. If the user has attached an image (a product label, ingredients list, a prescription, or any other document/photo), actually look at it and use what it shows to answer — read label text, identify ingredients, describe what's visible — instead of asking the user to just describe it in words. If the image is unclear or doesn't show what's needed to answer, say so specifically (e.g. "the ingredient list isn't legible in this photo") rather than guessing at its contents.

A pre-computed safety classification for this turn is included in the context and is authoritative — let it shape your tone (e.g. for POTENTIAL_ALLERGY_CONFLICT or URGENT_MEDICAL_ATTENTION, lead with the warning before anything else). For SAFE_INFORMATIONAL or CAUTION, lead with the actual answer.
`.trim();

interface DoctorPersonaInfo {
  doctorName: string;
  qualification: string | null;
  clinicHospitalName: string | null;
  district: string;
}

/**
 * Interim persona for the Doctor Portal's per-doctor consult screen — this is
 * still the same Gemini call and the same safety/emergency gating as the
 * general assistant, but answers in the first person as the doctor's own
 * consultation voice instead of a third-party "wellness guide" describing
 * products. This exists because there is no real two-way doctor messaging
 * yet; the moment that ships, this persona is meant to be retired in favor of
 * an actual human doctor on the other end. Never invent medical credentials,
 * physical-exam findings, or lab results the AI doesn't have — the persona
 * changes tone and framing, not what's actually knowable from a chat.
 */
function buildDoctorConsultSystemInstruction(doctor: DoctorPersonaInfo): string {
  return `
You are AyurTrace+'s AI, currently standing in for ${doctor.doctorName}${doctor.qualification ? ` (${doctor.qualification})` : ''}${doctor.clinicHospitalName ? ` of ${doctor.clinicHospitalName}` : ''} in a private consultation chat. The user already knows this is an AI stand-in (the app discloses this once, up front, outside this conversation) — you do not need to repeat that disclosure again, and you should never break character to re-mention it mid-chat. From this point on, BE this doctor having a real conversation with a patient who came to them with something on their mind — not an assistant summarizing information at them.

WRITE LIKE AN ACTUAL DOCTOR TALKING TO A PATIENT, NOT LIKE SOFTWARE:
- Talk the way a doctor actually talks in the room: natural, warm, a little informal, using contractions ("I'd", "that's", "you're"). React to what the patient says before moving on — a quick "That sounds uncomfortable" or "I hear you" or "Okay, thanks for telling me that" before you get into advice, the way a real person responds instead of jumping straight to a structured answer.
- Never write in bullet points, numbered lists, or headers in your replies — a doctor speaking to you does not format their sentences that way. Write in flowing conversational paragraphs, short ones, like actual spoken turns.
- Never refer to yourself as "an AI," "an assistant," "a model," or similar, and never say things like "I can't examine you" as a throat-clearing disclaimer before answering — the one-time up-front disclosure already covers that. Just talk as the doctor, plainly, the way they would.
- Ask about the patient the way a doctor does in conversation — how long something's been going on, whether it's gotten worse, what they've already tried — woven naturally into the reply, not as a clinical checklist.

CORE RULES (never break these):
1. This is a private one-on-one consultation with this specific doctor's persona. NEVER suggest the user browse to other doctors, the Doctor Portal, or "find a doctor near you" — they are already exactly where that would lead them. If RETRIEVED CONTEXT lists a matching product, recommend it directly and explain its traditional use and how to use it.
2. You have not physically examined this patient — so never claim to have performed an exam, never invent lab results or a specific diagnosis, and never prescribe a dosage beyond what's documented. Speak with a doctor's directness and warmth, not a doctor's authority to diagnose from an exam you haven't done.
3. If the message describes an emergency or something that genuinely needs an in-person visit or a real diagnosis, say so plainly and recommend the user visit ${doctor.clinicHospitalName || 'the clinic'} in person or call ahead — don't soften it, and don't redirect to a different doctor.
4. Never invent specifics that would need to be verified: no fake ingredients, prices, studies, or citations beyond what's in RETRIEVED CONTEXT. If RETRIEVED CONTEXT lists no matching product, say so plainly but still answer the underlying Ayurveda/wellness question from general traditional knowledge.
5. Ask a short, relevant follow-up question when the request is broad, rather than immediately answering. Don't ask more than one or two before proceeding.
6. Keep responses concise — a few short spoken-style paragraphs at most. Detect which language the user's message is written/spoken in — English, Tamil, Hindi, Kannada, Telugu, or Tulu (in Kannada script) — and reply in that same language; don't ask which language to use.
7. Stay focused on Ayurveda, health, and this consultation — for off-topic requests, briefly and warmly redirect back to the consultation, the way a doctor would gently steer a chatty patient back on topic.
8. If the user has attached an image (a product label, prescription, or other document/photo), actually read it and use it to answer directly, the way a doctor glancing at what a patient hands them would — don't ask them to describe it in words instead.

A pre-computed safety classification for this turn is included in context and is authoritative — for POTENTIAL_ALLERGY_CONFLICT or URGENT_MEDICAL_ATTENTION, lead with the warning before anything else, still in the same natural spoken voice, not a formatted alert.
`.trim();
}

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
async function fetchDoctorById(doctorId: string): Promise<DoctorPersonaInfo | null> {
  const { data } = await supabaseAdmin
    .from('ayurvedic_doctors')
    .select('doctor_name, qualification, clinic_hospital_name, district')
    .eq('id', doctorId)
    .maybeSingle();
  if (!data) return null;
  return {
    doctorName: data.doctor_name,
    qualification: data.qualification,
    clinicHospitalName: data.clinic_hospital_name,
    district: data.district,
  };
}

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

/** Case-insensitive dedupe that keeps the first-seen casing/wording. */
function dedupeAppend(existing: string[], additions: string[]): string[] {
  const seen = new Set(existing.map((s) => s.toLowerCase().trim()));
  const merged = [...existing];
  for (const raw of additions) {
    const trimmed = raw.trim();
    const norm = trimmed.toLowerCase();
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      merged.push(trimmed);
    }
  }
  return merged;
}

/**
 * If the user just told the assistant something about their own health
 * (an allergy, a condition, a medication, a pregnancy status), fold it into
 * their Health Profile automatically instead of making them re-enter it on
 * the settings screen. Strictly consent-gated: only runs for a user who
 * already has a customer_wellness row AND has opted into
 * consent_store_health_data — never creates that row or that consent itself,
 * since health data storage requires the user's own explicit opt-in (see the
 * two consent toggles in Health Profile, and the privacy policy). Fire-and-
 * forget from the caller's perspective — this never blocks or fails a chat
 * reply, it only best-effort enriches the profile in the background.
 */
async function maybeUpdateHealthProfileFromMessage(userId: string, content: string, geminiService: GeminiService): Promise<void> {
  if (!geminiService.isConfigured) return;

  const { data: row } = await supabaseAdmin
    .from('customer_wellness')
    .select('consent_store_health_data, has_allergies, allergies, has_existing_conditions, conditions, current_medication_tags, pregnancy_status')
    .eq('user_id', userId)
    .maybeSingle();
  if (!row || !row.consent_store_health_data) return;

  const facts = await geminiService.extractHealthFacts(content);
  if (!facts) return;

  const updates: Record<string, unknown> = {};

  const mergedAllergies = dedupeAppend(row.allergies ?? [], facts.allergies);
  if (mergedAllergies.length > (row.allergies ?? []).length) {
    updates.allergies = mergedAllergies;
    if (row.has_allergies !== 'yes') updates.has_allergies = 'yes';
  }

  const mergedConditions = dedupeAppend(row.conditions ?? [], facts.conditions);
  if (mergedConditions.length > (row.conditions ?? []).length) {
    updates.conditions = mergedConditions;
    if (row.has_existing_conditions !== 'yes') updates.has_existing_conditions = 'yes';
  }

  const mergedMedications = dedupeAppend(row.current_medication_tags ?? [], facts.medications);
  if (mergedMedications.length > (row.current_medication_tags ?? []).length) {
    updates.current_medication_tags = mergedMedications;
  }

  if (facts.pregnancyStatus && row.pregnancy_status === 'undisclosed') {
    updates.pregnancy_status = facts.pregnancyStatus;
  }

  if (Object.keys(updates).length === 0) return;
  await supabaseAdmin.from('customer_wellness').update(updates).eq('user_id', userId);
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
        `which matches an ingredient in a product that came up for your request. Avoid it — AyurTrace+ has verified Ayurvedic doctors you can ask in the Doctor Portal if you'd like guidance.`
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

  async transcribe(userId: string, buffer: Buffer, mimeType: string) {
    const text = await this.geminiService.transcribeAudio(buffer, mimeType);
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
    coordinates?: { latitude: number; longitude: number },
    doctorId?: string,
    image?: { mimeType: string; data: string }
  ): Promise<SendMessageResult> {
    const doctorPersona = doctorId ? await fetchDoctorById(doctorId) : null;
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('customer_chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .maybeSingle();
    if (sessionError || !session) throw { status: 404, message: 'Chat session not found', isOperational: true };

    await supabaseAdmin.from('customer_chat_messages').insert({ session_id: sessionId, role: 'user', content });
    const titleUpdate = session.title ? {} : { title: content.slice(0, 60) };

    // Best-effort, non-blocking — never lets a slow/failed extraction delay
    // or break the actual chat reply.
    void maybeUpdateHealthProfileFromMessage(userId, content, this.geminiService).catch((err) =>
      logger.error(`[ChatbotService] health profile auto-update failed: ${(err as Error).message}`)
    );

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
    // Skipped entirely inside a doctor-consult session: the user is already
    // talking to a specific doctor, so surfacing alternates is the wrong CTA.
    const nearbyDoctors = coordinates && !doctorPersona ? await findNearbyDoctors(coordinates) : [];

    const allergyConflicts = products.flatMap((p) => findAllergyConflicts(p, healthProfile));
    const hasContraindicationNote = hasRelevantContraindication(products, healthProfile);
    const hasMedicationNote = hasRelevantMedicationInteraction(products, healthProfile);
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
        : "The app already tried to silently attach the user's live device location to this message and it was unavailable (permission not yet granted, or denied) — do NOT ask the user for a ZIP code or address, this app only supports live device location, not manual entry. If the user is asking to find something nearby, tell them in one short sentence to allow Location access for the AyurTrace+ app in their phone's Settings and then ask again.",
      doctorPersona
        ? 'This is a private consultation with one specific doctor (see your persona instructions) — do not mention other doctors, the Doctor Portal, or finding doctors nearby at all.'
        : coordinates
          ? nearbyDoctors.length
            ? `Nearby Ayurvedic doctors: ${nearbyDoctors
                .map((d) => `${d.doctor_name}${d.clinic_hospital_name ? ` (${d.clinic_hospital_name})` : ''}, ${d.district}`)
                .join('; ')}. If a doctor consultation is warranted, mention that AyurTrace+ has verified Ayurvedic doctors listed in the app's Doctor Portal and the user can ask them directly there — do not imply they can be reached through this chat, and do not tell the user to "consult a certified doctor" as a generic outside referral when the app already has real, verified doctors available.`
            : 'No doctors found nearby in the reference directory.'
          : "The app already tried to silently attach the user's live device location and it was unavailable — see the note above. If a doctor consultation seems warranted but no location is available, still tell the user AyurTrace+ has verified Ayurvedic doctors in the app's Doctor Portal they can ask directly, rather than a generic \"see a doctor\" referral.",
      `Detect the language of the user's message below and respond in that same language (English, Tamil, Hindi, Kannada, Telugu, or Tulu in Kannada script) — this account's stored language preference is "${LANGUAGE_NAMES[appLogin?.language ?? 'en'] ?? 'English'}", use that only as a fallback if the message itself is ambiguous.`,
    ].join('\n');

    const turns: ChatTurn[] = history.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));
    turns.push({ role: 'user', content: `${contextBlock}\n\nUser message: ${content}` });

    const systemInstruction = doctorPersona ? buildDoctorConsultSystemInstruction(doctorPersona) : SYSTEM_INSTRUCTION;

    let reply: string;
    let aiAvailable = true;
    try {
      reply = await this.geminiService.generateReply(systemInstruction, turns, image);
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
