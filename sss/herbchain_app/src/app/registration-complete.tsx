import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Colors, Fonts, Type, Spacing, BorderRadius, Shadow } from '@/theme';
import Icon, { IconName } from '@/components/Icon';
import BotanicalBackdrop from '@/components/BotanicalBackdrop';

interface SectionRow {
  label: string;
  done: boolean;
  icon: IconName;
}

export default function RegistrationCompleteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    completion?: string;
    wellness?: string;
    warning?: string;
    ayurvedicId?: string;
  }>();

  const completion = Number(params.completion ?? 0);
  const wellnessDone = params.wellness === '1';
  const warning = params.warning;
  const ayurvedicId = params.ayurvedicId;

  const [copied, setCopied] = useState(false);

  async function copyAyurvedicId() {
    if (!ayurvedicId) return;
    await Clipboard.setStringAsync(ayurvedicId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const sections: SectionRow[] = [
    { label: 'Personal Details', done: true, icon: 'person-outline' },
    { label: 'Identity', done: completion >= 40, icon: 'card-outline' },
    { label: 'Location', done: completion >= 60, icon: 'map-outline' },
    { label: 'Wellness Profile', done: wellnessDone, icon: 'heart-outline' },
  ];

  // Ring geometry: a full-circle track with a foreground arc masked to the
  // completed fraction. Rendered with borders so it needs no SVG dependency.
  const ringSize = 168;

  return (
    <SafeAreaView style={styles.container}>
      <BotanicalBackdrop />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.sealWrap}>
          <View style={styles.seal}>
            <Icon name="checkmark" size={40} color={Colors.onPrimary} />
          </View>
        </View>

        <Text style={styles.title}>Your AyurTrace+ Profile Is Ready</Text>
        <Text style={styles.body}>
          You can now scan any AyurTrace+ product to trace its full botanical journey.
        </Text>

        {ayurvedicId ? (
          <View style={styles.ayurvedicIdCard}>
            <Text style={styles.ayurvedicIdLabel}>Your Ayurvedic ID</Text>
            <Text style={styles.ayurvedicIdValue}>{ayurvedicId}</Text>
            <TouchableOpacity style={styles.copyBtn} onPress={copyAyurvedicId} activeOpacity={0.8}>
              <Icon name={copied ? 'checkmark' : 'copy-outline'} size={16} color={Colors.onPrimaryContainer} />
              <Text style={styles.copyBtnText}>{copied ? 'Copied' : 'Copy'}</Text>
            </TouchableOpacity>
            <Text style={styles.ayurvedicIdHint}>
              You'll need this along with your email and password to sign in — save it somewhere safe.
            </Text>
          </View>
        ) : null}

        {/* Completion ring */}
        <View style={[styles.ringOuter, { width: ringSize, height: ringSize, borderRadius: ringSize / 2 }]}>
          <View
            style={[
              styles.ringFill,
              {
                width: ringSize - 16,
                height: ringSize - 16,
                borderRadius: (ringSize - 16) / 2,
              },
            ]}
          >
            <Text style={styles.ringValue}>{completion}%</Text>
            <Text style={styles.ringLabel}>Complete</Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(completion, 100)}%` }]} />
        </View>

        <View style={styles.sectionCard}>
          {sections.map((s, i) => (
            <View key={s.label} style={[styles.sectionRow, i > 0 && styles.sectionRowDivided]}>
              <View style={[styles.sectionIcon, s.done && styles.sectionIconDone]}>
                <Icon
                  name={s.done ? 'checkmark' : s.icon}
                  size={16}
                  color={s.done ? Colors.onPrimary : Colors.outline}
                />
              </View>
              <Text style={[styles.sectionLabel, !s.done && styles.sectionLabelPending]}>
                {s.label}
              </Text>
              <Text style={[styles.sectionState, s.done && styles.sectionStateDone]}>
                {s.done ? 'Added' : 'Not added'}
              </Text>
            </View>
          ))}
        </View>

        {warning ? (
          <View style={styles.warnCard}>
            <Icon name="information-circle" size={16} color={Colors.onTertiaryFixedVariant} />
            <Text style={styles.warnText}>{warning}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>Start Exploring AyurTrace+</Text>
        </TouchableOpacity>

        {completion < 100 && (
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace('/(tabs)/profile')}>
            <Text style={styles.secondaryBtnText}>Complete my profile later</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing['3xl'],
    alignItems: 'center',
  },
  sealWrap: { marginBottom: Spacing.lg },
  seal: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.onTertiaryContainer,
  },
  title: { ...Type.headlineLgMobile, color: Colors.primary, textAlign: 'center' },
  body: {
    ...Type.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  ayurvedicIdCard: {
    alignSelf: 'stretch',
    backgroundColor: Colors.primaryContainer,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  ayurvedicIdLabel: { ...Type.labelCaps, color: Colors.onPrimaryContainer },
  ayurvedicIdValue: {
    fontFamily: Fonts.family.serifSemiBold,
    fontSize: Fonts.size.xl,
    color: Colors.onPrimaryContainer,
    letterSpacing: 1,
    marginTop: 4,
  },
  ayurvedicIdHint: {
    ...Type.bodySm,
    color: Colors.onPrimaryContainer,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.onPrimaryContainer + '20',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    marginTop: Spacing.sm,
  },
  copyBtnText: { ...Type.labelMd, color: Colors.onPrimaryContainer },
  ringOuter: {
    borderWidth: 8,
    borderColor: Colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  ringFill: {
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  ringValue: { ...Type.displayLg, fontSize: 44, lineHeight: 50, color: Colors.primary },
  ringLabel: { ...Type.labelCaps, color: Colors.onSurfaceVariant },
  progressTrack: {
    alignSelf: 'stretch',
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceContainerHigh,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: Colors.secondary },
  sectionCard: {
    alignSelf: 'stretch',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    paddingHorizontal: Spacing.base,
    ...Shadow.md,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.base,
  },
  sectionRowDivided: { borderTopWidth: 1, borderTopColor: Colors.outlineVariant },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionIconDone: { backgroundColor: Colors.secondary },
  sectionLabel: { flex: 1, ...Type.bodyMd, color: Colors.onSurface },
  sectionLabelPending: { color: Colors.outline },
  sectionState: { ...Type.bodySm, color: Colors.outline },
  sectionStateDone: { color: Colors.secondary, fontFamily: Fonts.family.semiBold },
  warnCard: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.tertiaryFixed,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.base,
  },
  warnText: { ...Type.bodySm, color: Colors.onTertiaryFixedVariant, flex: 1 },
  primaryBtn: {
    alignSelf: 'stretch',
    minHeight: 54,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  primaryBtnText: { ...Type.labelMd, fontSize: 16, color: Colors.onPrimary },
  secondaryBtn: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm },
  secondaryBtnText: { ...Type.labelMd, color: Colors.primaryContainer },
});
