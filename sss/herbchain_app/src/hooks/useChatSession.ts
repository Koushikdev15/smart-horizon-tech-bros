import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';
import { ApiError } from '@/lib/api';
import { chatService, type ChatDoctorCard, type ChatGuidanceCard, type ChatProductCard, type ChatStoreCard, type ResponseCategory } from '@/services/chatService';
import { useAuthStore } from '@/store/authStore';

export interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  category?: ResponseCategory;
  products?: ChatProductCard[];
  doctorGuidance?: ChatGuidanceCard[];
  stores?: ChatStoreCard[];
  doctors?: ChatDoctorCard[];
  aiAvailable?: boolean;
  isError?: boolean;
}

/**
 * Shared chat-session state/logic behind both the general "Ask AyurTrace+"
 * screen and the doctor-consult screen — both talk to the same backend
 * chat pipeline (there's no per-doctor server-side behavior, only different
 * screen chrome), so this is the single place that owns it.
 */
export function useChatSession(enabled: boolean) {
  const userLanguage = useAuthStore((s) => s.user?.language);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    (async () => {
      try {
        const session = await chatService.createSession();
        setSessionId(session._id);
      } catch (err) {
        setSessionError(err instanceof ApiError ? err.message : 'Could not start a chat session.');
      }
    })();
  }, [enabled]);

  // Auto-attach location once per session instead of a manual toggle — a
  // denied/unavailable location just means "near me" queries silently have
  // no location context, same graceful degradation the backend already
  // handles for coordinates being absent.
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  useEffect(() => {
    if (!enabled) return;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCoordinates({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      } catch {
        // Silent — chat just proceeds without location context.
      }
    })();
  }, [enabled]);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [micState, setMicState] = useState<'idle' | 'recording' | 'transcribing' | 'denied'>('idle');
  const [micError, setMicError] = useState<string | null>(null);

  async function handleMicPress() {
    if (micState === 'recording') {
      try {
        await recorder.stop();
        const uri = recorder.uri;
        if (!uri) {
          setMicState('idle');
          return;
        }
        setMicState('transcribing');
        const result = await chatService.transcribeAudio(uri, userLanguage === 'ta' ? 'ta' : 'en');
        setInputText((prev) => (prev ? `${prev} ${result.text}` : result.text));
        setMicError(null);
      } catch (err) {
        setMicError(err instanceof ApiError ? err.message : 'Could not transcribe that recording.');
      } finally {
        setMicState('idle');
      }
      return;
    }

    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        setMicState('denied');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setMicState('recording');
      setMicError(null);
    } catch {
      setMicState('denied');
    }
  }

  async function handleSend(textToSend?: string) {
    const text = (textToSend ?? inputText).trim();
    if (!text || !sessionId || sending) return;

    setMessages((prev) => [...prev, { id: `usr-${Date.now()}`, role: 'user', content: text }]);
    setInputText('');
    setSending(true);

    try {
      const result = await chatService.sendMessage(sessionId, text, coordinates ?? undefined);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: result.reply,
          category: result.category,
          products: result.products,
          doctorGuidance: result.doctorGuidance,
          stores: result.stores,
          doctors: result.doctors,
          aiAvailable: result.aiAvailable,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: err instanceof ApiError ? err.message : 'Something went wrong. Please try again.',
          isError: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  const scrollRef = useRef<any>(null);

  return {
    sessionId,
    sessionError,
    messages,
    inputText,
    setInputText,
    sending,
    handleSend,
    micState,
    micError,
    handleMicPress,
    scrollRef,
  };
}
