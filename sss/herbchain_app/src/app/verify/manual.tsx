import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '@/theme';
import { AppHeader } from '@/components/Header';
import { PrimaryButton } from '@/components/Buttons';
import Icon from '@/components/Icon';

export default function ManualVerificationScreen() {
  const router = useRouter();
  const [batchId, setBatchId] = useState('AYUR-ASH-2026-000458');

  const handleVerify = () => {
    if (!batchId.trim()) return;
    router.push(`/verify/${batchId.trim()}` as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showBack onBackPress={() => router.back()} title="Manual Batch Verification" />

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Icon name="keypad-outline" size={32} color={Colors.primary} />
          </View>

          <Text style={styles.title}>Enter Product Batch ID</Text>
          <Text style={styles.desc}>
            Enter the 16-character AyurTrace+ Batch ID printed on your product label or receipt.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Batch ID</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="e.g. AYUR-ASH-2026-000458"
                value={batchId}
                onChangeText={setBatchId}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <PrimaryButton title="Verify Batch" onPress={handleVerify} size="lg" />

          {/* Quick Demo Options */}
          <Text style={styles.demoTitle}>Or try a demo batch:</Text>
          <View style={styles.demoRow}>
            <TouchableOpacity
              style={styles.demoChip}
              onPress={() => setBatchId('AYUR-ASH-2026-000458')}
            >
              <Text style={styles.demoChipText}>Ashwagandha</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoChip}
              onPress={() => setBatchId('AYUR-TUL-2026-000271')}
            >
              <Text style={styles.demoChipText}>Tulsi Extract</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoChip, { backgroundColor: Colors.errorContainer }]}
              onPress={() => setBatchId('AYUR-TRI-2026-000099')}
            >
              <Text style={[styles.demoChipText, { color: Colors.error }]}>Recalled Batch</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    ...Shadow.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: Fonts.family.serifSemiBold,
    fontSize: Fonts.size.xl,
    color: Colors.text,
    textAlign: 'center',
  },
  desc: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs + 1,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.xl,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.size.sm,
    color: Colors.text,
    marginBottom: 6,
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 48,
    backgroundColor: Colors.cream,
    justifyContent: 'center',
  },
  input: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.base,
    color: Colors.primary,
    letterSpacing: 1,
  },
  demoTitle: {
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xs,
  },
  demoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs + 2,
  },
  demoChip: {
    backgroundColor: Colors.lightGreen,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  demoChipText: {
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.size.xs,
    color: Colors.primary,
  },
});
