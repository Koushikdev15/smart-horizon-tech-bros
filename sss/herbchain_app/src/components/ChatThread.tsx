import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Type, Spacing, BorderRadius, Shadow } from '@/theme';
import Icon, { IconName } from './Icon';
import type { ChatDoctorCard, ChatGuidanceCard, ChatProductCard, ChatStoreCard, ResponseCategory } from '@/services/chatService';
import type { DisplayMessage } from '@/hooks/useChatSession';

const SUGGESTED_PROMPTS = [
  'What Ayurvedic products may help with digestion?',
  'I am looking for an Ayurvedic product for general stress support.',
  'Does this product contain anything I am allergic to?',
  'What are the ingredients in this product?',
  'Find products available near me.',
];

// windowSoftInputMode (native AndroidManifest) would normally handle this on
// Android, but that config only takes effect in a custom dev-client/standalone
// build — it's baked in at native-build time. Running in plain Expo Go means
// the app always runs inside Expo's own fixed, pre-built manifest, so this
// screen needs KeyboardAvoidingView on both platforms to keep the input above
// the keyboard.
const KeyboardWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
    {children}
  </KeyboardAvoidingView>
);

const CATEGORY_META: Partial<Record<ResponseCategory, { label: string; icon: IconName; bg: string; fg: string }>> = {
  URGENT_MEDICAL_ATTENTION: { label: 'Urgent medical attention', icon: 'alert-circle', bg: Colors.errorContainer, fg: Colors.onErrorContainer },
  POTENTIAL_ALLERGY_CONFLICT: { label: 'Potential safety concern', icon: 'warning', bg: Colors.errorContainer, fg: Colors.onErrorContainer },
  CAUTION: { label: 'Caution', icon: 'alert-circle-outline', bg: Colors.tertiaryFixed, fg: Colors.onTertiaryFixedVariant },
  POTENTIAL_INTERACTION: { label: 'Possible interaction', icon: 'alert-circle-outline', bg: Colors.tertiaryFixed, fg: Colors.onTertiaryFixedVariant },
  MEDICAL_CONSULTATION_RECOMMENDED: { label: 'Consult a doctor', icon: 'medkit-outline', bg: Colors.tertiaryFixed, fg: Colors.onTertiaryFixedVariant },
  INSUFFICIENT_INFORMATION: { label: 'Limited information available', icon: 'help-circle-outline', bg: Colors.surfaceContainerHigh, fg: Colors.onSurfaceVariant },
};

// Categories worth nudging the user toward the Doctor Portal for.
const CONSULT_CATEGORIES: ResponseCategory[] = [
  'URGENT_MEDICAL_ATTENTION',
  'POTENTIAL_ALLERGY_CONFLICT',
  'POTENTIAL_INTERACTION',
  'CAUTION',
];

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

function DoctorCardMini({ doctor }: { doctor: ChatDoctorCard }) {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/doctor-consult/${doctor.id}` as any)}>
      <View style={styles.cardHeaderRow}>
        <Icon name="medkit-outline" size={16} color={Colors.secondary} />
        <Text style={styles.cardTitle}>{doctor.doctorName}</Text>
      </View>
      {doctor.clinicHospitalName && <Text style={styles.cardLine}>{doctor.clinicHospitalName}</Text>}
      <Text style={styles.cardLine}>{doctor.district}</Text>
      <Text style={[styles.cardLine, { color: Colors.primary, fontFamily: Fonts.family.semiBold }]}>Tap to consult →</Text>
    </TouchableOpacity>
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

interface ChatThreadProps {
  sessionId: string | null;
  sessionError: string | null;
  messages: DisplayMessage[];
  inputText: string;
  setInputText: (v: string) => void;
  sending: boolean;
  handleSend: (text?: string) => void;
  micState: 'idle' | 'recording' | 'transcribing' | 'denied';
  micError: string | null;
  handleMicPress: () => void;
  attachingImage?: boolean;
  handleAttachImage?: () => void;
  scrollRef: React.RefObject<any>;
  greeting: string;
  disclaimer: string;
  /** Renders a "Consult a Doctor" chip under cautionary replies. Omit to hide it entirely (e.g. already on the doctor-consult screen). */
  showConsultCta?: boolean;
  /** 'doctor' gives the thread a private-consult look (different avatar/bubble
   *  tint, no per-message AI footer since the screen's own top banner already
   *  discloses it once) instead of the general "Ask AyurTrace+" assistant look. */
  variant?: 'assistant' | 'doctor';
  placeholder?: string;
  suggestedPrompts?: string[];
}

export function ChatThread({
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
  attachingImage = false,
  handleAttachImage,
  scrollRef,
  greeting,
  disclaimer,
  showConsultCta = false,
  variant = 'assistant',
  placeholder,
  suggestedPrompts,
}: ChatThreadProps) {
  const router = useRouter();
  const isDoctor = variant === 'doctor';
  const prompts = suggestedPrompts ?? SUGGESTED_PROMPTS;

  return (
    <KeyboardWrapper>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.chatScroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.disclaimerBox, isDoctor && styles.disclaimerBoxDoctor]}>
          <Icon name={isDoctor ? 'medkit' : 'information-circle'} size={16} color={isDoctor ? Colors.onSecondaryContainer : Colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.disclaimerText, isDoctor && styles.disclaimerTextDoctor]}>{disclaimer}</Text>
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
            <View style={[styles.aiAvatar, isDoctor && styles.aiAvatarDoctor]}>
              <Icon name={isDoctor ? 'medkit-outline' : 'sparkles'} size={16} color={isDoctor ? Colors.onSecondaryContainer : Colors.gold} />
            </View>
            <View style={[styles.msgBubble, isDoctor ? styles.aiBubbleDoctor : styles.aiBubble, Shadow.sm]}>
              <Text style={[styles.msgText, styles.aiText]}>{greeting}</Text>
            </View>
          </View>
        )}

        {messages.map((msg) => {
          const isAi = msg.role === 'assistant';
          const meta = msg.category ? CATEGORY_META[msg.category] : undefined;
          const showCta = showConsultCta && isAi && msg.category && CONSULT_CATEGORIES.includes(msg.category);
          return (
            <View key={msg.id} style={{ marginBottom: Spacing.md }}>
              <View style={[styles.msgRow, isAi ? styles.aiRow : styles.userRow]}>
                {isAi && (
                  <View style={[styles.aiAvatar, isDoctor && styles.aiAvatarDoctor]}>
                    <Icon name={isDoctor ? 'medkit-outline' : 'sparkles'} size={16} color={isDoctor ? Colors.onSecondaryContainer : Colors.gold} />
                  </View>
                )}
                <View
                  style={[
                    styles.msgBubble,
                    isAi ? (isDoctor ? styles.aiBubbleDoctor : styles.aiBubble) : styles.userBubble,
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
                  {msg.imageUri && <Image source={{ uri: msg.imageUri }} style={styles.msgImage} />}
                  <Text style={[styles.msgText, isAi ? styles.aiText : styles.userText]}>{msg.content}</Text>
                  {isAi && !msg.isError && !isDoctor && (
                    <Text style={styles.aiSourceTag}>
                      {msg.aiAvailable === false ? 'Direct data summary' : 'AI-generated explanation'} · not written by a doctor
                    </Text>
                  )}
                </View>
              </View>

              {showCta && (
                <TouchableOpacity
                  style={styles.consultCta}
                  onPress={() => router.push('/(tabs)/doctor-portal' as any)}
                >
                  <Icon name="medkit-outline" size={14} color={Colors.primary} />
                  <Text style={styles.consultCtaText}>Consult a Doctor →</Text>
                </TouchableOpacity>
              )}

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
              {msg.doctors && msg.doctors.length > 0 && (
                <View style={styles.cardsCol}>
                  {msg.doctors.map((d) => (
                    <DoctorCardMini key={d.id} doctor={d} />
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {sending && (
          <View style={[styles.msgRow, styles.aiRow]}>
            <View style={[styles.aiAvatar, isDoctor && styles.aiAvatarDoctor]}>
              <Icon name={isDoctor ? 'medkit-outline' : 'sparkles'} size={16} color={isDoctor ? Colors.onSecondaryContainer : Colors.gold} />
            </View>
            <View style={[styles.msgBubble, isDoctor ? styles.aiBubbleDoctor : styles.aiBubble, Shadow.sm, styles.typingBubble]}>
              <ActivityIndicator size="small" color={Colors.textMuted} />
              <Text style={styles.typingText}>{isDoctor ? 'Typing…' : 'AyurTrace+ is thinking…'}</Text>
            </View>
          </View>
        )}

        {messages.length === 0 && (
          <View style={styles.promptsContainer}>
            <Text style={styles.promptsTitle}>Suggested Questions</Text>
            <View style={styles.promptsGrid}>
              {prompts.map((prompt) => (
                <TouchableOpacity key={prompt} style={styles.promptChip} onPress={() => handleSend(prompt)}>
                  <Text style={styles.promptText}>&quot;{prompt}&quot;</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {micState === 'denied' && (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>Microphone permission denied — you can still type your question.</Text>
        </View>
      )}
      {micError && (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>{micError}</Text>
        </View>
      )}

      <View style={[styles.inputBar, isDoctor && styles.inputBarDoctor]}>
        {handleAttachImage && (
          <TouchableOpacity
            style={[styles.micBtn, isDoctor && styles.micBtnDoctor]}
            onPress={handleAttachImage}
            disabled={attachingImage || sending}
            accessibilityLabel="Attach a photo or document"
          >
            {attachingImage ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Icon name="camera-outline" size={19} color={Colors.primary} />
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.micBtn, isDoctor && styles.micBtnDoctor, micState === 'recording' && styles.micBtnActive]}
          onPress={handleMicPress}
          disabled={micState === 'transcribing'}
          accessibilityLabel={micState === 'recording' ? 'Stop recording' : 'Record a voice question'}
        >
          {micState === 'transcribing' ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Icon
              name={micState === 'recording' ? 'stop-circle' : 'mic-outline'}
              size={18}
              color={micState === 'recording' ? Colors.error : Colors.primary}
            />
          )}
        </TouchableOpacity>
        <TextInput
          style={[styles.textInput, isDoctor && styles.textInputDoctor]}
          placeholder={placeholder ?? 'Ask AyurTrace+...'}
          value={inputText}
          onChangeText={setInputText}
          placeholderTextColor={Colors.textMuted}
          editable={Boolean(sessionId) && !sending}
          onSubmitEditing={() => handleSend()}
        />
        <TouchableOpacity
          style={[styles.sendBtn, isDoctor && styles.sendBtnDoctor, (!sessionId || sending) && styles.sendBtnDisabled]}
          onPress={() => handleSend()}
          disabled={!sessionId || sending}
        >
          <Icon name="send" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardWrapper>
  );
}

// Re-nudge scroll-to-end when the keyboard opens — exported so screens can
// wire it into their own effect since `scrollRef` is owned by the caller.
export function useKeyboardScrollNudge(scrollRef: React.RefObject<any>, deps: any[]) {
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    const sub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    });
    return () => sub.remove();
  }, []);
}

const styles = StyleSheet.create({
  chatScroll: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: 280,
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
  disclaimerBoxDoctor: {
    backgroundColor: Colors.secondaryContainer,
    borderWidth: 1,
    borderColor: Colors.gold + '50',
  },
  disclaimerTextDoctor: {
    color: Colors.onSecondaryContainer,
    fontFamily: Fonts.family.medium,
  },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end' },
  aiRow: { justifyContent: 'flex-start' },
  userRow: { justifyContent: 'flex-end' },
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
  aiAvatarDoctor: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.gold,
  },
  aiBubbleDoctor: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.md,
    borderBottomLeftRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  errorBubble: { borderColor: Colors.error },
  msgImage: {
    width: 180,
    height: 180,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.surfaceVariant,
  },
  msgText: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.sm + 1,
    lineHeight: 20,
  },
  aiText: { color: Colors.text },
  userText: { color: Colors.white },
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
  categoryTagText: { ...Type.labelMd, fontSize: 11 },
  consultCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginLeft: 40,
    marginTop: Spacing.xs,
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  consultCtaText: {
    fontFamily: Fonts.family.semiBold,
    fontSize: 11,
    color: Colors.primary,
  },
  typingBubble: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  typingText: { ...Type.bodySm, color: Colors.textMuted },
  cardsCol: { marginTop: Spacing.sm, marginLeft: 40, gap: Spacing.sm },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.md,
  },
  guidanceCard: { borderColor: Colors.gold + '60' },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.xs },
  cardTitle: { ...Type.labelMd, color: Colors.primary, flex: 1 },
  cardLine: { ...Type.bodySm, color: Colors.onSurfaceVariant, marginTop: 2 },
  cardLineLabel: { fontFamily: Fonts.family.semiBold, color: Colors.onSurface },
  cardWarnLine: { color: Colors.error },
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
  verifiedBadgeText: { ...Type.labelMd, fontSize: 10, color: Colors.onSecondaryContainer },
  promptsContainer: { marginTop: Spacing.lg, marginBottom: Spacing.md },
  promptsTitle: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.xs + 1,
    color: Colors.textMuted,
    marginBottom: Spacing.xs + 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  promptsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs + 2 },
  promptChip: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  promptText: { fontFamily: Fonts.family.medium, fontSize: Fonts.size.xs, color: Colors.primary },
  noticeBox: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xs,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  noticeText: { ...Type.bodySm, fontSize: 11, color: Colors.textMuted },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  micBtnActive: { backgroundColor: Colors.errorContainer },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  inputBarDoctor: {
    backgroundColor: Colors.secondaryContainer + '30',
    borderTopWidth: 2,
    borderTopColor: Colors.gold + '50',
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
  textInputDoctor: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gold + '40',
  },
  micBtnDoctor: {
    borderRadius: BorderRadius.md,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDoctor: {
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.onSecondaryContainer,
  },
  sendBtnDisabled: { opacity: 0.5 },
});
