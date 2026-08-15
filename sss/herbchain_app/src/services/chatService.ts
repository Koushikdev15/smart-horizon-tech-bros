import { apiRequest } from '@/lib/api';

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

export interface SendMessageResponse {
  sessionId: string;
  reply: string;
  category: ResponseCategory;
  sources: ChatSource[];
  products: ChatProductCard[];
  doctorGuidance: ChatGuidanceCard[];
  stores: ChatStoreCard[];
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
};
