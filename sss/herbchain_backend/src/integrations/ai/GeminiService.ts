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
                  'Transcribe this audio verbatim, in whichever language is actually being spoken — it will be ' +
                  'English, Tamil, Hindi, Kannada, Telugu, or Tulu. Write it in that language\'s own native script ' +
                  '(Tulu, if spoken, should be written in Kannada script, which is the common practice since Tulu ' +
                  'lacks a widely used digital script). Do not translate it into a different language. Return only ' +
                  'the transcribed text, no commentary.',
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
}
