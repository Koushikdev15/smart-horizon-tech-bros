import { apiRequest, ApiError, getAuthTokenForUpload, API_BASE_URL_FOR_UPLOAD } from '@/lib/api';

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

export const chatService = {
  async createSession(): Promise<{ _id: string }> {
    return apiRequest('/chat/session', { method: 'POST' });
  },

  async sendMessage(
    sessionId: string,
    content: string,
    coordinates?: { latitude: number; longitude: number }
  ): Promise<SendMessageResponse> {
    return apiRequest(`/chat/session/${sessionId}/message`, {
      method: 'POST',
      body: JSON.stringify({ content, coordinates }),
    });
  },

  /**
   * Uploads a short recording and returns its transcription. Not routed
   * through apiRequest — that helper hardcodes a JSON Content-Type, which
   * would break this request's multipart boundary.
   */
  async transcribeAudio(uri: string, language: 'en' | 'ta'): Promise<{ text: string }> {
    // expo-audio's HIGH_QUALITY preset records AAC in an .m4a container, but
    // Gemini's documented supported audio MIME types don't include
    // "audio/m4a" (only audio/aac, audio/wav, audio/mp3, audio/aiff,
    // audio/ogg, audio/flac) — sending the container name instead of the
    // codec name here made every transcription fail silently.
    const formData = new FormData();
    formData.append('audio', { uri, name: 'recording.m4a', type: 'audio/aac' } as unknown as Blob);
    formData.append('language', language);

    const token = getAuthTokenForUpload();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL_FOR_UPLOAD}/chat/transcribe`, {
        method: 'POST',
        headers,
        body: formData,
      });
    } catch {
      throw new ApiError(0, "Couldn't reach the server. Check your connection and try again.");
    }

    let body: { success: boolean; message: string; data?: { text: string }; errors?: unknown } | undefined;
    try {
      body = await response.json();
    } catch {
      // no-op — some error responses may not carry a JSON body
    }

    if (!response.ok || !body?.success || !body.data) {
      throw new ApiError(response.status, body?.message || `Request failed (${response.status})`, body?.errors);
    }
    return body.data;
  },
};
