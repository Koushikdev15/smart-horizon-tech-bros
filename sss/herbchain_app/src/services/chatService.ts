import * as FileSystem from 'expo-file-system/legacy';
import { apiRequest, ApiError } from '@/lib/api';

export type ResponseCategory =
  | 'SAFE_INFORMATIONAL'
  | 'CAUTION'
  | 'POTENTIAL_ALLERGY_CONFLICT'
  | 'POTENTIAL_INTERACTION'
  | 'MEDICAL_CONSULTATION_RECOMMENDED'
  | 'URGENT_MEDICAL_ATTENTION'
  | 'INSUFFICIENT_INFORMATION';

export interface ChatSource {
  type: 'product' | 'doctor_guidance';
  id: string;
  label: string;
}

export interface ChatProductCard {
  _id: string;
  productName: string;
  ingredients: { name: string; scientificName?: string }[];
  healthTopics: string[];
  description?: string;
  usageInstructions?: string;
  precautions?: string;
  contraindications?: string;
}

export interface ChatGuidanceCard {
  guidanceId: string;
  title: string;
  doctorName: string;
}

export interface ChatStoreCard {
  _id: string;
  name: string;
  address: string;
  distanceKm: number;
  isOpenNow: boolean | null;
}

export interface ChatMessageDTO {
  _id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  category?: ResponseCategory;
  sources: ChatSource[];
  createdAt: string;
}

export interface ChatDoctorCard {
  id: string;
  doctorName: string;
  clinicHospitalName: string | null;
  district: string;
}

export interface SendMessageResponse {
  sessionId: string;
  reply: string;
  category: ResponseCategory;
  sources: ChatSource[];
  products: ChatProductCard[];
  doctorGuidance: ChatGuidanceCard[];
  stores: ChatStoreCard[];
  doctors: ChatDoctorCard[];
  aiAvailable: boolean;
}

/**
 * Reads a local file straight to base64 via expo-file-system. Deliberately
 * NOT `fetch(uri).then(r => r.blob())` — under this app's React Native New
 * Architecture, fetching a local file:// URI into a Blob silently returns a
 * near-empty blob (confirmed: a real multi-second recording arrived
 * server-side as 14 bytes), and the classic FormData `{ uri, name, type }`
 * descriptor object is rejected outright ("Unsupported FormDataPart
 * implementation"). Reading the file directly and sending it as base64 JSON
 * — the same transport every other endpoint here already uses reliably —
 * sidesteps both failure modes at once.
 */
async function readFileAsBase64(uri: string): Promise<string> {
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
}

export const chatService = {
  async createSession(): Promise<{ _id: string }> {
    return apiRequest('/chat/session', { method: 'POST' });
  },

  async sendMessage(
    sessionId: string,
    content: string,
    coordinates?: { latitude: number; longitude: number },
    doctorId?: string
  ): Promise<SendMessageResponse> {
    return apiRequest(`/chat/session/${sessionId}/message`, {
      method: 'POST',
      body: JSON.stringify({ content, coordinates, doctorId }),
    });
  },

  /**
   * Sends a photo or document (a product label, an ingredients list, a
   * prescription, a lab report PDF) alongside an optional caption, and gets
   * back the same shape as a normal text message — the file is never
   * stored, only used for this one reply, same "ephemeral" treatment as voice.
   */
  async sendImageMessage(
    sessionId: string,
    imageUri: string,
    content: string,
    coordinates?: { latitude: number; longitude: number },
    doctorId?: string,
    mimeTypeOverride?: string
  ): Promise<SendMessageResponse> {
    const ext = imageUri.split('.').pop()?.toLowerCase().split('?')[0] || 'jpg';
    const mimeType =
      mimeTypeOverride ||
      (ext === 'pdf'
        ? 'application/pdf'
        : ext === 'png'
          ? 'image/png'
          : ext === 'webp'
            ? 'image/webp'
            : 'image/jpeg');

    let imageBase64: string;
    try {
      imageBase64 = await readFileAsBase64(imageUri);
    } catch {
      throw new ApiError(0, 'Could not read that file. Please try again.');
    }

    return apiRequest(
      `/chat/session/${sessionId}/image-message`,
      { method: 'POST', body: JSON.stringify({ content, coordinates, doctorId, imageBase64, mimeType }) },
      45000
    );
  },

  /**
   * Uploads a short recording and returns its transcription. The backend
   * auto-detects which of the app's supported languages (English, Tamil,
   * Hindi, Kannada, Telugu, Tulu) was actually spoken rather than forcing a
   * fixed target — no language needs to be passed in here.
   */
  async transcribeAudio(uri: string): Promise<{ text: string }> {
    // expo-audio's HIGH_QUALITY preset records AAC in an .m4a container, but
    // Gemini's documented supported audio MIME types don't include
    // "audio/m4a" (only audio/aac, audio/wav, audio/mp3, audio/aiff,
    // audio/ogg, audio/flac) — sending the container name instead of the
    // codec name here made every transcription fail silently.
    let audioBase64: string;
    try {
      audioBase64 = await readFileAsBase64(uri);
    } catch {
      throw new ApiError(0, 'Could not read that recording. Please try again.');
    }

    return apiRequest(
      '/chat/transcribe',
      { method: 'POST', body: JSON.stringify({ audioBase64, mimeType: 'audio/aac' }) },
      45000
    );
  },
};
