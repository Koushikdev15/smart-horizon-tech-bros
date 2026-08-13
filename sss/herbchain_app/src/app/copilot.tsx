import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '@/theme';
import { AppHeader } from '@/components/Header';
import Icon from '@/components/Icon';
import type { CopilotMessage } from '@/types';

const SUGGESTED_PROMPTS = [
  'Is this product verified?',
  'Where did this herb come from?',
  'Explain this laboratory report.',
  'Why is the Trust Score 96%?',
  'Show me the product journey.',
  'What does DNA verification mean?',
];

export default function CopilotScreen() {
  const router = useRouter();

  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'm-1',
      role: 'assistant',
      content:
        'Hello! I am AyurTrace Copilot ✨. I can help you understand your Ayurvedic product’s lab tests, ingredient origin, or blockchain traceability records. How can I assist you today?',
      timestamp: 'Just now',
    },
  ]);

  const [inputText, setInputText] = useState('');

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg: CopilotMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    // Generate intelligent AI response based on verified prompt
    setTimeout(() => {
      let replyText =
        'AyurTrace+ verified records confirm that Ashwagandha Capsules (Batch AYUR-ASH-2026-000458) passed all 8 NABL laboratory safety tests including purity (96.2%), heavy metals, and DNA verification.';

      const lower = text.toLowerCase();
      if (lower.includes('where') || lower.includes('come from') || lower.includes('origin')) {
        replyText =
          'The Ashwagandha roots in this batch were sustainably wild-harvested in Perundurai, Erode district, Tamil Nadu on June 20, 2026.';
      } else if (lower.includes('score') || lower.includes('96%')) {
        replyText =
          'The 96% Trust Score is calculated from 100% Source Verification, 96% Lab Testing, 98% Traceability, 92% Documentation, and 94% Sustainability metrics.';
      } else if (lower.includes('dna')) {
        replyText =
          'DNA Barcoding verification ensures that the plant species in the formulation is 100% authentic Withania somnifera and contains zero adulterant plant species.';
      } else if (lower.includes('journey') || lower.includes('timeline')) {
        replyText =
          'The product journey consists of 7 verified stages: Herb Source → Collection Centre → Processing → Laboratory Testing → Manufacturing → Distribution → Retail.';
      }

      const aiMsg: CopilotMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: replyText,
        timestamp: 'Just now',
      };

      setMessages((prev) => [...prev, aiMsg]);
    }, 600);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showBack onBackPress={() => router.back()} title="AyurTrace Copilot ✨" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.chatScroll} showsVerticalScrollIndicator={false}>
          {/* Disclaimer Header Box */}
          <View style={styles.disclaimerBox}>
            <Icon name="information-circle" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.disclaimerText}>
              AyurTrace Copilot uses verified backend product data. It does not provide medical diagnoses.
            </Text>
          </View>

          {/* Messages */}
          {messages.map((msg) => {
            const isAi = msg.role === 'assistant';
            return (
              <View
                key={msg.id}
                style={[
                  styles.msgRow,
                  isAi ? styles.aiRow : styles.userRow,
                ]}
              >
                {isAi && (
                  <View style={styles.aiAvatar}>
                    <Icon name="sparkles" size={16} color={Colors.gold} />
                  </View>
                )}
                <View
                  style={[
                    styles.msgBubble,
                    isAi ? styles.aiBubble : styles.userBubble,
                    Shadow.sm,
                  ]}
                >
                  <Text style={[styles.msgText, isAi ? styles.aiText : styles.userText]}>
                    {msg.content}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Suggested Prompts */}
          <View style={styles.promptsContainer}>
            <Text style={styles.promptsTitle}>Suggested Questions</Text>
            <View style={styles.promptsGrid}>
              {SUGGESTED_PROMPTS.map((prompt) => (
                <TouchableOpacity
                  key={prompt}
                  style={styles.promptChip}
                  onPress={() => handleSend(prompt)}
                >
                  <Text style={styles.promptText}>"{prompt}"</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask AyurTrace Copilot..."
            value={inputText}
            onChangeText={setInputText}
            placeholderTextColor={Colors.textMuted}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={() => handleSend()}>
            <Icon name="send" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    marginBottom: Spacing.md,
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
});
