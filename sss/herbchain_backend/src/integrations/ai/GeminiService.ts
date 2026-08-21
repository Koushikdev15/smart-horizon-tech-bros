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

  async generateReply(systemInstruction: string, history: ChatTurn[]): Promise<string> {
    if (!this.client) {
      throw new GeminiUnavailableError('AI assistant is not configured (missing GEMINI_API_KEY).');
    }

    try {
      const response = await this.client.models.generateContent({
        model: MODEL,
        contents: history.map((turn) => ({
          role: turn.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: turn.content }],
        })),
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
   */
  async transcribeAudio(buffer: Buffer, mimeType: string, language: 'en' | 'ta'): Promise<string> {
    if (!this.client) {
      throw new GeminiUnavailableError('Voice transcription is not configured (missing GEMINI_API_KEY).');
    }

    const languageName = language === 'ta' ? 'Tamil' : 'English';

    try {
      const response = await this.client.models.generateContent({
        model: MODEL,
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType, data: buffer.toString('base64') } },
              { text: `Transcribe this audio verbatim in ${languageName}. Return only the transcribed text, no commentary.` },
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
