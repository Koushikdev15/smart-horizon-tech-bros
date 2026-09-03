import { GoogleGenAI } from '@google/genai';
import logger from '../../utils/logger';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export class GeminiUnavailableError extends Error {
  constructor(message = 'The AI assistant is temporarily unavailable. Please try again shortly.') {
    super(message);
    this.name = 'GeminiUnavailableError';
  }
}

const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';

/**
 * Thin, isolated wrapper around the Gemini API — the API key lives only here,
 * on the backend, and is never exposed to the Flutter/RN client (see spec
 * "FINAL INSTRUCTION": isolate external AI behind a backend service).
 */
export class GeminiService {
  private client: GoogleGenAI | null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.client = apiKey ? new GoogleGenAI({ apiKey }) : null;
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  async generateReply(
    systemInstruction: string,
    history: ChatTurn[],
    image?: { mimeType: string; data: string }
  ): Promise<string> {
    if (!this.client) {
      throw new GeminiUnavailableError('AI assistant is not configured (missing GEMINI_API_KEY).');
    }

    try {
      const lastIndex = history.length - 1;
      const response = await this.client.models.generateContent({
        model: MODEL,
        contents: history.map((turn, i) => {
          const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [{ text: turn.content }];
          // Attached only to the current (last) user turn — never re-sent on
          // every subsequent turn in the same session.
          if (image && i === lastIndex && turn.role === 'user') {
            parts.unshift({ inlineData: image });
          }
          return { role: turn.role === 'assistant' ? 'model' : 'user', parts };
        }),
        config: { systemInstruction, temperature: 0.4 },
      });

      const text = response.text;
      if (!text) throw new GeminiUnavailableError('The AI assistant returned an empty response.');
      return text;
    } catch (err) {
      if (err instanceof GeminiUnavailableError) throw err;
      logger.error(`[GeminiService] generateContent failed: ${(err as Error).message}`);
      throw new GeminiUnavailableError();
    }
  }

  /**
   * Transcribes a short voice-chat recording. Text-only, never stored —
   * the caller just drops the result into the chat input for the user to
   * review/edit before sending, same as if they'd typed it.
   *
   * Auto-detects the spoken language rather than forcing translation into a
   * fixed target — the app supports English, Tamil, Hindi, Kannada, Telugu,
   * and Tulu, and a user should be able to just speak in whichever of these
   * they're comfortable with. The transcript then flows into the normal chat
   * pipeline, which detects the language of the message text itself and
   * replies in kind — so nothing downstream needs to know which language
   * was spoken, only what was said.
   */
  async transcribeAudio(buffer: Buffer, mimeType: string): Promise<string> {
    if (!this.client) {
      throw new GeminiUnavailableError('Voice transcription is not configured (missing GEMINI_API_KEY).');
    }

    try {
      const response = await this.client.models.generateContent({
        model: MODEL,
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType, data: buffer.toString('base64') } },
              {
                text:
                  'Transcribe this audio verbatim. First identify which language is actually being spoken, from this ' +
                  'exact list — English (Latin script), Tamil (தமிழ், Tamil script), Hindi (हिन्दी, Devanagari script), ' +
                  'Kannada (ಕನ್ನಡ, Kannada script), Telugu (తెలుగు, Telugu script), or Tulu (ತುಳು, written in Kannada ' +
                  'script since Tulu has no widely used digital script of its own). Then write the transcript in that ' +
                  'exact language and script — never English unless the speaker is actually speaking English. This is ' +
                  'important: Kannada audio must be transcribed in Kannada script (ಕನ್ನಡ), not translated or ' +
                  'transliterated into English — do not let "Kannada" sound like "Canada" mislead you into treating ' +
                  'it as an English-speaking request. Do not translate the content into a different language under ' +
                  'any circumstances, no matter which of the six languages above is spoken. Return only the ' +
                  'transcribed text in its native script, no commentary, no language label.',
              },
            ],
          },
        ],
        config: { temperature: 0 },
      });

      const text = response.text;
      if (!text) throw new GeminiUnavailableError('Could not transcribe the recording.');
      return text.trim();
    } catch (err) {
      if (err instanceof GeminiUnavailableError) throw err;
      logger.error(`[GeminiService] transcribeAudio failed: ${(err as Error).message}`);
      throw new GeminiUnavailableError('Could not transcribe the recording.');
    }
  }

  /**
   * Best-effort extraction of explicitly self-stated health facts from a
   * single chat message, so the Health Profile can auto-fill itself instead
   * of making the user re-type what they already told the assistant. Only
   * called for users who already opted into health-data storage (see
   * ChatbotService) — this never creates consent, only acts once it exists.
   * Returns null on any failure or parse issue; callers must treat that as
   * "nothing extracted," never retry-worthy.
   */
  async extractHealthFacts(message: string): Promise<ExtractedHealthFacts | null> {
    if (!this.client) return null;

    try {
      const response = await this.client.models.generateContent({
        model: MODEL,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text:
                  'You extract ONLY explicitly self-stated personal health facts from a single chat message, to ' +
                  'auto-fill a health profile. The message may be in English, Tamil, Hindi, Kannada, Telugu, or ' +
                  'Tulu — extract the facts and write them out in English regardless of the message\'s language. ' +
                  'Output strict JSON only, no markdown fences, no commentary, in exactly this shape:\n' +
                  '{"allergies": string[], "conditions": string[], "medications": string[], "pregnancyStatus": ' +
                  '"pregnant" | "breastfeeding" | "planning" | null}\n' +
                  'Rules — only include a fact if the user states it about THEMSELVES, in the first person, as a ' +
                  'real current fact (not a question, not hypothetical, not about someone else, not a symptom they ' +
                  'have today like "I have a headache"):\n' +
                  '- allergies: short noun phrases for foods/ingredients/substances they say they are allergic to.\n' +
                  '- conditions: existing medical conditions/diagnoses they say they have (e.g. diabetes, asthma, ' +
                  'hypertension) — not a one-off symptom.\n' +
                  '- medications: medications/drugs they say they are currently taking.\n' +
                  '- pregnancyStatus: only if they explicitly state they are currently pregnant, breastfeeding, or ' +
                  'trying to conceive; otherwise null.\n' +
                  'If nothing in the message qualifies, return {"allergies":[],"conditions":[],"medications":[],' +
                  '"pregnancyStatus":null}. Never guess, infer, or pad with examples.\n\n' +
                  `Message: ${message}`,
              },
            ],
          },
        ],
        config: { temperature: 0, responseMimeType: 'application/json' },
      });

      const text = response.text;
      if (!text) return null;
      const parsed = JSON.parse(text);
      return {
        allergies: Array.isArray(parsed.allergies) ? parsed.allergies.filter((v: unknown) => typeof v === 'string') : [],
        conditions: Array.isArray(parsed.conditions) ? parsed.conditions.filter((v: unknown) => typeof v === 'string') : [],
        medications: Array.isArray(parsed.medications) ? parsed.medications.filter((v: unknown) => typeof v === 'string') : [],
        pregnancyStatus: ['pregnant', 'breastfeeding', 'planning'].includes(parsed.pregnancyStatus)
          ? parsed.pregnancyStatus
          : null,
      };
    } catch (err) {
      logger.error(`[GeminiService] extractHealthFacts failed: ${(err as Error).message}`);
      return null;
    }
  }
}

export interface ExtractedHealthFacts {
  allergies: string[];
  conditions: string[];
  medications: string[];
  pregnancyStatus: 'pregnant' | 'breastfeeding' | 'planning' | null;
}
