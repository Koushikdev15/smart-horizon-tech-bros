import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Colors, Fonts, Type, Spacing, BorderRadius, Shadow } from '@/theme';
import { AppHeader } from '@/components/Header';
import Icon, { IconName } from '@/components/Icon';
import { ApiError } from '@/lib/api';
import { chatService, type ChatGuidanceCard, type ChatProductCard, type ChatStoreCard, type ResponseCategory } from '@/services/chatService';
import { useAuthStore } from '@/store/authStore';
import { GuestGate } from '@/components/GuestGate';

const SUGGESTED_PROMPTS = [
  'What Ayurvedic products may help with digestion?',
  'I am looking for an Ayurvedic product for general stress support.',
  'Does this product contain anything I am allergic to?',
  'What are the ingredients in this product?',
  'Find products available near me.',
];

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  category?: ResponseCategory;
  products?: ChatProductCard[];
  doctorGuidance?: ChatGuidanceCard[];
  stores?: ChatStoreCard[];
  aiAvailable?: boolean;
  isError?: boolean;
}

/** iOS needs KeyboardAvoidingView; Android already resizes via windowSoftInputMode. */
const KeyboardWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  Platform.OS === 'ios' ? (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      {children}
    </KeyboardAvoidingView>
  ) : (
    <View style={{ flex: 1 }}>{children}</View>
  );

const CATEGORY_META: Partial<
  Record<ResponseCategory, { label: string; icon: IconName; bg: string; fg: string }>
> = {
  URGENT_MEDICAL_ATTENTION: { label: 'Urgent medical attention', icon: 'alert-circle', bg: Colors.errorContainer, fg: Colors.onErrorContainer },
  POTENTIAL_ALLERGY_CONFLICT: { label: 'Potential safety concern', icon: 'warning', bg: Colors.errorContainer, fg: Colors.onErrorContainer },
  CAUTION: { label: 'Caution', icon: 'alert-circle-outline', bg: Colors.tertiaryFixed, fg: Colors.onTertiaryFixedVariant },
  POTENTIAL_INTERACTION: { label: 'Possible interaction', icon: 'alert-circle-outline', bg: Colors.tertiaryFixed, fg: Colors.onTertiaryFixedVariant },
  MEDICAL_CONSULTATION_RECOMMENDED: { label: 'Consult a doctor', icon: 'medkit-outline', bg: Colors.tertiaryFixed, fg: Colors.onTertiaryFixedVariant },
  INSUFFICIENT_INFORMATION: { label: 'Limited information available', icon: 'help-circle-outline', bg: Colors.surfaceContainerHigh, fg: Colors.onSurfaceVariant },
};

function ProductCardMini({ product }: { product: ChatProductCard }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Icon name="leaf-outline" size={16} color={Colors.secondary} />
        <Text style={styles.cardTitle}>{product.productName}</Text>
      </View>
      {product.ingredients.length > 0 && (
        <Text style={styles.cardLine}>
          <Text style={styles.cardLineLabel}>Ingredients: </Text>
          {product.ingredients.map((i) => i.name).join(', ')}
        </Text>
      )}
      {product.healthTopics.length > 0 && (
        <Text style={styles.cardLine}>
          <Text style={styles.cardLineLabel}>Documented use: </Text>
          {product.healthTopics.join(', ')}
        </Text>
      )}
      {product.usageInstructions ? (
        <Text style={styles.cardLine}>
          <Text style={styles.cardLineLabel}>Usage: </Text>
          {product.usageInstructions}
        </Text>
      ) : null}
      {product.contraindications ? (
        <Text style={[styles.cardLine, styles.cardWarnLine]}>
          <Text style={styles.cardLineLabel}>Contraindications: </Text>
          {product.contraindications}
        </Text>
      ) : null}
    </View>
  );
}

function StoreCardMini({ store }: { store: ChatStoreCard }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Icon name="storefront-outline" size={16} color={Colors.secondary} />
        <Text style={styles.cardTitle}>{store.name}</Text>
      </View>
      <Text style={styles.cardLine}>{store.address}</Text>
      <Text style={styles.cardLine}>
        {store.distanceKm} km away
        {store.isOpenNow !== null ? (store.isOpenNow ? ' · Open now' : ' · Closed') : ''}
      </Text>
    </View>
  );
}

function GuidanceCardMini({ guidance }: { guidance: ChatGuidanceCard }) {
  return (
    <View style={[styles.card, styles.guidanceCard]}>
      <View style={styles.cardHeaderRow}>
        <Icon name="ribbon-outline" size={16} color={Colors.gold} />
        <Text style={styles.cardTitle}>{guidance.title}</Text>
      </View>
      <Text style={styles.cardLine}>Reviewed by Dr. {guidance.doctorName}</Text>
      <View style={styles.verifiedBadge}>
        <Icon name="checkmark-circle" size={12} color={Colors.onSecondaryContainer} />
        <Text style={styles.verifiedBadgeText}>Verified by AyurTrace+</Text>
      </View>
    </View>
  );
}

export default function CopilotScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isGuest = useAuthStore((s) => s.isGuest);
  const canChat = isAuthenticated && !isGuest;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!canChat) return;
    (async () => {
      try {
        const session = await chatService.createSession();
        setSessionId(session._id);
      } catch (err) {
        setSessionError(err instanceof ApiError ? err.message : 'Could not start a chat session.');
      }
    })();
  }, [canChat]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, sending]);

  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationState, setLocationState] = useState<'idle' | 'requesting' | 'denied'>('idle');

  async function handleShareLocation() {
    if (coordinates) {
      setCoordinates(null);
      return;
    }
    setLocationState('requesting');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationState('denied');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoordinates({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      setLocationState('idle');
    } catch {
      setLocationState('denied');
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
          aiAvailable: result.aiAvailable,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: err instanceof ApiError ? err.message : "Something went wrong. Please try again.",
          isError: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showBack onBackPress={() => router.back()} title="Ask AyurTrace+" />

      <GuestGate message="Sign in to chat with AyurTrace+ and get answers personalized to your health profile.">
      <KeyboardWrapper>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.chatScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.disclaimerBox}>
            <Icon name="information-circle" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.disclaimerText}>
              Explore verified Ayurvedic information. I ask a few questions before showing relevant options, and I
              never diagnose or replace professional medical advice.
            </Text>
          </View>

          {sessionError ? (
            <View style={styles.card}>
              <Text style={[styles.cardLine, styles.cardWarnLine]}>{sessionError}</Text>
            </View>
          ) : !sessionId ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : (
            <View style={[styles.msgRow, styles.aiRow]}>
              <View style={styles.aiAvatar}>
                <Icon name="sparkles" size={16} color={Colors.gold} />
              </View>
              <View style={[styles.msgBubble, styles.aiBubble, Shadow.sm]}>
                <Text style={[styles.msgText, styles.aiText]}>
                  Hello! I can help you explore Ayurvedic products and their documented uses. I&apos;ll ask a few
                  questions before showing relevant options.
                </Text>
              </View>
            </View>
          )}

          {messages.map((msg) => {
            const isAi = msg.role === 'assistant';
            const meta = msg.category ? CATEGORY_META[msg.category] : undefined;
            return (
              <View key={msg.id} style={{ marginBottom: Spacing.md }}>
                <View style={[styles.msgRow, isAi ? styles.aiRow : styles.userRow]}>
                  {isAi && (
                    <View style={styles.aiAvatar}>
                      <Icon name="sparkles" size={16} color={Colors.gold} />
                    </View>
                  )}
                  <View
                    style={[
                      styles.msgBubble,
                      isAi ? styles.aiBubble : styles.userBubble,
                      msg.isError && styles.errorBubble,
                      Shadow.sm,
                    ]}
                  >
                    {meta && (
                      <View style={[styles.categoryTag, { backgroundColor: meta.bg }]}>
                        <Icon name={meta.icon} size={13} color={meta.fg} />
                        <Text style={[styles.categoryTagText, { color: meta.fg }]}>{meta.label}</Text>
                      </View>
                    )}
                    <Text style={[styles.msgText, isAi ? styles.aiText : styles.userText]}>{msg.content}</Text>
                    {isAi && !msg.isError && (
                      <Text style={styles.aiSourceTag}>
                        {msg.aiAvailable === false ? 'Direct data summary' : 'AI-generated explanation'} · not written by a doctor
                      </Text>
                    )}
                  </View>
                </View>

                {msg.products && msg.products.length > 0 && (
                  <View style={styles.cardsCol}>
                    {msg.products.map((p) => (
                      <ProductCardMini key={p._id} product={p} />
                    ))}
                  </View>
                )}
                {msg.doctorGuidance && msg.doctorGuidance.length > 0 && (
                  <View style={styles.cardsCol}>
                    {msg.doctorGuidance.map((g) => (
                      <GuidanceCardMini key={g.guidanceId} guidance={g} />
                    ))}
                  </View>
                )}
                {msg.stores && msg.stores.length > 0 && (
                  <View style={styles.cardsCol}>
                    {msg.stores.map((s) => (
                      <StoreCardMini key={s._id} store={s} />
                    ))}
                  </View>
                )}
              </View>
            );
          })}

          {sending && (
            <View style={[styles.msgRow, styles.aiRow]}>
              <View style={styles.aiAvatar}>
                <Icon name="sparkles" size={16} color={Colors.gold} />
              </View>
              <View style={[styles.msgBubble, styles.aiBubble, Shadow.sm, styles.typingBubble]}>
                <ActivityIndicator size="small" color={Colors.textMuted} />
                <Text style={styles.typingText}>AyurTrace+ is thinking…</Text>
              </View>
            </View>
          )}

          {messages.length === 0 && (
            <View style={styles.promptsContainer}>
              <Text style={styles.promptsTitle}>Suggested Questions</Text>
              <View style={styles.promptsGrid}>
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <TouchableOpacity key={prompt} style={styles.promptChip} onPress={() => handleSend(prompt)}>
                    <Text style={styles.promptText}>&quot;{prompt}&quot;</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {locationState === 'denied' && (
          <View style={styles.locationDeniedBox}>
            <Text style={styles.locationDeniedText}>
              Location permission denied — &quot;near me&quot; results won&apos;t be available.
            </Text>
          </View>
        )}

        <View style={styles.inputBar}>
          <TouchableOpacity
            style={[styles.locationBtn, coordinates && styles.locationBtnActive]}
            onPress={handleShareLocation}
            disabled={locationState === 'requesting'}
            accessibilityLabel={coordinates ? 'Stop sharing location' : 'Share location for nearby results'}
          >
            {locationState === 'requesting' ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Icon name={coordinates ? 'location' : 'location-outline'} size={18} color={coordinates ? Colors.onSecondaryContainer : Colors.primary} />
            )}
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            placeholder="Ask AyurTrace+..."
            value={inputText}
            onChangeText={setInputText}
            placeholderTextColor={Colors.textMuted}
            editable={Boolean(sessionId) && !sending}
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!sessionId || sending) && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!sessionId || sending}
          >
            <Icon name="send" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardWrapper>
      </GuestGate>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  chatScroll: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  loadingRow: { paddingVertical: Spacing.lg, alignItems: 'center' },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGreen,
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  disclaimerText: {
    flex: 1,
    fontFamily: Fonts.family.regular,
    fontSize: 11,
    color: Colors.primary,
    lineHeight: 15,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  aiRow: {
    justifyContent: 'flex-start',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.darkGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  msgBubble: {
    maxWidth: '80%',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.md,
  },
  aiBubble: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  errorBubble: {
    borderColor: Colors.error,
  },
  msgText: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.sm + 1,
    lineHeight: 20,
  },
  aiText: {
    color: Colors.text,
  },
  userText: {
    color: Colors.white,
  },
  aiSourceTag: {
    ...Type.bodySm,
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  categoryTagText: {
    ...Type.labelMd,
    fontSize: 11,
  },
  typingBubble: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  typingText: { ...Type.bodySm, color: Colors.textMuted },
  cardsCol: {
    marginTop: Spacing.sm,
    marginLeft: 40,
    gap: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.md,
  },
  guidanceCard: {
    borderColor: Colors.gold + '60',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs,
  },
  cardTitle: {
    ...Type.labelMd,
    color: Colors.primary,
    flex: 1,
  },
  cardLine: {
    ...Type.bodySm,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  cardLineLabel: {
    fontFamily: Fonts.family.semiBold,
    color: Colors.onSurface,
  },
  cardWarnLine: {
    color: Colors.error,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
  },
  verifiedBadgeText: {
    ...Type.labelMd,
    fontSize: 10,
    color: Colors.onSecondaryContainer,
  },
  promptsContainer: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  promptsTitle: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.xs + 1,
    color: Colors.textMuted,
    marginBottom: Spacing.xs + 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  promptsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs + 2,
  },
  promptChip: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  promptText: {
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.size.xs,
    color: Colors.primary,
  },
  locationDeniedBox: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xs,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  locationDeniedText: {
    ...Type.bodySm,
    fontSize: 11,
    color: Colors.textMuted,
  },
  locationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  locationBtnActive: {
    backgroundColor: Colors.secondaryContainer,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.sm,
    color: Colors.text,
    marginRight: Spacing.sm,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
