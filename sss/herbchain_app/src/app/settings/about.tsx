import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '@/theme';
import { AppHeader } from '@/components/Header';
import Icon from '@/components/Icon';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showBack onBackPress={() => router.back()} title="About AyurTrace+" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, Shadow.md]}>
          <View style={styles.logoBadge}>
            <Icon name="leaf" size={40} color={Colors.gold} />
          </View>

          <Text style={styles.brandTitle}>
            AYUTRACE<Text style={styles.goldPlus}>+</Text>
          </Text>
          <Text style={styles.tagline}>Trace • Verify • Trust</Text>

          <View style={styles.divider} />

          <Text style={styles.descText}>
            AyurTrace+ is an end-to-end blockchain traceability platform designed to restore consumer trust in Ayurvedic healthcare products. By tracking medicinal herbs from registered harvest regions through processing, laboratory testing, and manufacturing, AyurTrace+ ensures authentic, unadulterated Ayurveda for every customer.
          </Text>

          <View style={styles.specBox}>
            <Text style={styles.specTitle}>Platform Specs</Text>
            <Text style={styles.specLine}>• App Version: 1.0.0 (Production Build)</Text>
            <Text style={styles.specLine}>• Core Technology: React Native + Expo + TypeScript</Text>
            <Text style={styles.specLine}>• Blockchain Engine: Polygon Network Ledger</Text>
            <Text style={styles.specLine}>• Testing Accreditation: NABL Certified Labs</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  brandTitle: {
    fontFamily: Fonts.family.serifSemiBold,
    fontSize: Fonts.size['2xl'],
    color: Colors.primary,
  },
  goldPlus: {
    color: Colors.gold,
  },
  tagline: {
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.size.xs + 1,
    color: Colors.gold,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.lg,
  },
  descText: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  specBox: {
    width: '100%',
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.xl,
  },
  specTitle: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.xs + 1,
    color: Colors.text,
    marginBottom: 6,
  },
  specLine: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs,
    color: Colors.textSecondary,
    marginVertical: 2,
  },
});
