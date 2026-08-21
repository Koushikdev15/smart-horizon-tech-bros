import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '@/theme';
import { AppHeader } from '@/components/Header';
import Icon from '@/components/Icon';
import { getProductById, PRODUCTS } from '@/data/mockProducts';

export default function SafetyScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const product = getProductById(id || '') || PRODUCTS[0];
  const { safety } = product;

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showBack onBackPress={() => router.back()} title="Safety & Usage Information" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Verified Manufacturer Information Banner */}
        <View style={styles.verifiedTagBox}>
          <Icon name="shield-checkmark" size={18} color={Colors.success} />
          <Text style={styles.verifiedTagText}>
            Verified Manufacturer Information • Officially Supplied
          </Text>
        </View>

        {/* Usage Instructions */}
        <View style={[styles.card, Shadow.sm]}>
          <View style={styles.cardHeaderRow}>
            <Icon name="fitness-outline" size={22} color={Colors.primary} />
            <Text style={styles.cardTitle}>Usage Instructions</Text>
          </View>
          <Text style={styles.bodyText}>{safety.usage}</Text>
        </View>

        {/* Storage Conditions */}
        <View style={[styles.card, Shadow.sm]}>
          <View style={styles.cardHeaderRow}>
            <Icon name="thermometer-outline" size={22} color={Colors.primary} />
            <Text style={styles.cardTitle}>Storage Conditions</Text>
          </View>
          <Text style={styles.bodyText}>{safety.storage}</Text>
        </View>

        {/* Warnings */}
        <View style={[styles.card, { borderColor: Colors.tertiaryFixedDim }, Shadow.sm]}>
          <View style={styles.cardHeaderRow}>
            <Icon name="warning-outline" size={22} color={Colors.warning} />
            <Text style={[styles.cardTitle, { color: Colors.warning }]}>Warnings & Precautions</Text>
          </View>
          <Text style={styles.bodyText}>{safety.warnings}</Text>
        </View>

        {/* Contraindications */}
        <View style={[styles.card, { borderColor: Colors.error }, Shadow.sm]}>
          <View style={styles.cardHeaderRow}>
            <Icon name="alert-circle-outline" size={22} color={Colors.error} />
            <Text style={[styles.cardTitle, { color: Colors.error }]}>Contraindications</Text>
          </View>
          <Text style={styles.bodyText}>{safety.contraindications}</Text>
        </View>

        {/* Medical Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Icon name="information-circle-outline" size={16} color={Colors.textMuted} style={{ marginRight: 6 }} />
          <Text style={styles.disclaimerText}>
            AyurTrace+ displays verified manufacturer information. This information does not replace professional medical advice. Always consult a qualified Ayurvedic doctor.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.consultDoctorBtn}
          onPress={() => router.push('/(tabs)/doctor-portal' as any)}
        >
          <Icon name="medkit-outline" size={16} color={Colors.onPrimary} />
          <Text style={styles.consultDoctorBtnText}>Consult a Doctor</Text>
        </TouchableOpacity>
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
    paddingBottom: Spacing['2xl'],
  },
  verifiedTagBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGreen,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginVertical: Spacing.md,
  },
  verifiedTagText: {
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.size.xs,
    color: Colors.primary,
    marginLeft: 6,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.xs,
  },
  cardTitle: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.base,
    color: Colors.text,
  },
  bodyText: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs + 1,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: 4,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    marginTop: Spacing.sm,
  },
  disclaimerText: {
    flex: 1,
    fontFamily: Fonts.family.regular,
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  consultDoctorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: 12,
    marginTop: Spacing.md,
  },
  consultDoctorBtnText: {
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.size.sm,
    color: Colors.onPrimary,
  },
});
