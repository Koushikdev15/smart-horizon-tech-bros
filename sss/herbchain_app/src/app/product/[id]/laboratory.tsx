import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '@/theme';
import { AppHeader } from '@/components/Header';
import { LabResultCard } from '@/components/LabAndTimeline';
import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import Icon from '@/components/Icon';
import { getProductById, PRODUCTS } from '@/data/mockProducts';

export default function LaboratoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const product = getProductById(id || '') || PRODUCTS[0];

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showBack onBackPress={() => router.back()} title="Laboratory Quality Report" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Lab Header Box */}
        <View style={[styles.headerCard, Shadow.sm]}>
          <View style={styles.iconCircle}>
            <Icon name="flask" size={28} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{product.name}</Text>
            <Text style={styles.subText}>NABL Accredited Testing Facility</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Tested Quality Parameters ({product.labResults.length})</Text>

        {product.labResults.map((result) => (
          <LabResultCard key={result.id} result={result} />
        ))}

        {/* Action Buttons */}
        <View style={{ marginTop: Spacing.md, gap: Spacing.sm }}>
          <PrimaryButton
            title="Explain This Report with AyurTrace+"
            onPress={() => router.push('/copilot')}
            icon="sparkles"
          />

          <SecondaryButton
            title="View Official Certificate PDF"
            onPress={() => alert('Opening NABL Certificate Reference...')}
            icon="document-text-outline"
          />
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
    paddingBottom: Spacing['2xl'],
  },
  headerCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  title: {
    fontFamily: Fonts.family.serifSemiBold,
    fontSize: Fonts.size.lg,
    color: Colors.text,
  },
  subText: {
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.size.xs + 1,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.base,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
});
