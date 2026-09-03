import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';
import { ApiError } from '@/lib/api';
import { chatService, type ChatDoctorCard, type ChatGuidanceCard, type ChatProductCard, type ChatStoreCard, type ResponseCategory } from '@/services/chatService';

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
  /** Local echo only — the image itself is never uploaded anywhere persistent, just sent for this one reply. */
  imageUri?: string;
}

/**
 * Shared chat-session state/logic behind both the general "Ask AyurTrace+"
 * screen and the doctor-consult screen — both talk to the same backend
 * chat pipeline (there's no per-doctor server-side behavior, only different
 * screen chrome), so this is the single place that owns it.
 */
export function useChatSession(enabled: boolean, doctorId?: string) {
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

  // Auto-attach location instead of a manual toggle — a denied/unavailable
  // location just means "near me" queries silently have no location context,
  // same graceful degradation the backend already handles for coordinates
  // being absent. Re-attempted lazily on every send (not just once on mount)
  // so a slow first GPS fix, a permission granted mid-session, or a transient
  // failure all self-heal without the user needing to reopen the screen.
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);

  async function attemptGetLocation(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setCoordinates(coords);
      return coords;
    } catch {
      return null;
    }
  }

  useEffect(() => {
    if (!enabled) return;
    attemptGetLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [micState, setMicState] = useState<'idle' | 'recording' | 'transcribing' | 'denied'>('idle');
  const [micError, setMicError] = useState<string | null>(null);

  async function handleMicPress() {
    if (micState === 'recording') {
      try {
        await recorder.stop();
        let uri = recorder.uri;
        if (!uri) {
          setMicState('idle');
          return;
        }
        // Some Android builds hand back a bare filesystem path with no
        // scheme, which fetch/FormData can't resolve to read the file.
        if (!uri.startsWith('file://') && !uri.startsWith('content://')) {
          uri = `file://${uri}`;
        }
        const info = await FileSystem.getInfoAsync(uri);
        if (!info.exists || (info as { size?: number }).size === 0) {
          setMicError('The recording did not save properly — try again.');
          setMicState('idle');
          return;
        }
        setMicState('transcribing');
        const result = await chatService.transcribeAudio(uri);
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

  function pushAssistantReply(result: {
    reply: string;
    category: ResponseCategory;
    products: ChatProductCard[];
    doctorGuidance: ChatGuidanceCard[];
    stores: ChatStoreCard[];
    doctors: ChatDoctorCard[];
    aiAvailable: boolean;
  }) {
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
  }

  function pushErrorReply(err: unknown) {
    setMessages((prev) => [
      ...prev,
      {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: err instanceof ApiError ? err.message : 'Something went wrong. Please try again.',
        isError: true,
      },
    ]);
  }

  async function handleSend(textToSend?: string) {
    const text = (textToSend ?? inputText).trim();
    if (!text || !sessionId || sending) return;

    setMessages((prev) => [...prev, { id: `usr-${Date.now()}`, role: 'user', content: text }]);
    setInputText('');
    setSending(true);

    try {
      const coords = coordinates ?? (await attemptGetLocation()) ?? undefined;
      const result = await chatService.sendMessage(sessionId, text, coords, doctorId);
      pushAssistantReply(result);
    } catch (err) {
      pushErrorReply(err);
    } finally {
      setSending(false);
    }
  }

  const [attachingImage, setAttachingImage] = useState(false);

  async function sendAttachment(uri: string, caption: string, label: string, mimeType?: string) {
    const isImage = !mimeType || mimeType.startsWith('image/');
    setMessages((prev) => [...prev, { id: `usr-${Date.now()}`, role: 'user', content: caption || label, imageUri: isImage ? uri : undefined }]);
    setInputText('');
    setSending(true);

    try {
      const coords = coordinates ?? (await attemptGetLocation()) ?? undefined;
      const result = await chatService.sendImageMessage(sessionId!, uri, caption, coords, doctorId, mimeType);
      pushAssistantReply(result);
    } catch (err) {
      pushErrorReply(err);
    } finally {
      setSending(false);
    }
  }

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (picked.canceled || !picked.assets?.[0]) return;
    await sendAttachment(picked.assets[0].uri, inputText.trim(), 'Sent a photo', picked.assets[0].mimeType);
  }

  async function pickDocument() {
    const picked = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets?.[0]) return;
    await sendAttachment(picked.assets[0].uri, inputText.trim(), `Sent a document: ${picked.assets[0].name}`, picked.assets[0].mimeType);
  }

  function handleAttachImage() {
    if (!sessionId || sending || attachingImage) return;
    setAttachingImage(true);
    Alert.alert(
      'Attach',
      'What would you like to send?',
      [
        { text: 'Photo', onPress: () => pickPhoto().finally(() => setAttachingImage(false)) },
        { text: 'Document (PDF)', onPress: () => pickDocument().finally(() => setAttachingImage(false)) },
        { text: 'Cancel', style: 'cancel', onPress: () => setAttachingImage(false) },
      ],
      { onDismiss: () => setAttachingImage(false), cancelable: true }
    );
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
    attachingImage,
    handleAttachImage,
    scrollRef,
  };
}
