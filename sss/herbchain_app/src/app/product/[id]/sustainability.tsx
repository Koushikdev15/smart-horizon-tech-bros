import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '@/theme';
import { AppHeader } from '@/components/Header';
import Icon from '@/components/Icon';
import { getProductById, PRODUCTS } from '@/data/mockProducts';
import { productService, type SustainabilityResult } from '@/services/productService';
import { ApiError } from '@/lib/api';

const METRICS: { key: keyof SustainabilityResult['breakdown']; label: string }[] = [
  { key: 'ingredientTraceability', label: 'Ingredient Traceability' },
  { key: 'documentationCompleteness', label: 'Documentation Completeness' },
  { key: 'storeCoverage', label: 'Store Network Coverage' },
  { key: 'qrTraceability', label: 'QR Batch Traceability' },
];

export default function SustainabilityScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const mockProduct = getProductById(id || '') || PRODUCTS[0];

  const [result, setResult] = useState<SustainabilityResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Bridges this screen's demo product catalog to the real backend by
        // name, same as the suitability check on the product detail page —
        // only resolves once a real Product with a matching name exists.
        const data = await productService.getSustainability({ productName: mockProduct.name });
        if (!cancelled) setResult(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError && err.status === 404
              ? "This demo product isn't linked to a live AyurTrace+ product record yet, so a real score can't be computed."
              : err instanceof ApiError
                ? err.message
                : 'Could not load the sustainability score. Please try again.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mockProduct.name]);

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showBack onBackPress={() => router.back()} title="Sustainability Rating" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        )}

        {!loading && error && (
          <View style={[styles.card, Shadow.sm]}>
            <Icon name="information-circle-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!loading && result && (
          <>
            <View style={[styles.headerCard, Shadow.md]}>
              <View style={styles.iconCircle}>
                <Icon name="globe-outline" size={32} color={Colors.success} />
              </View>
              <Text style={styles.scoreText}>{result.score} / 100</Text>
              <Text style={styles.scoreLabel}>Data & Traceability Completeness</Text>
            </View>

            <View style={[styles.card, Shadow.sm]}>
              <Text style={styles.cardTitle}>Pillar Breakdown</Text>

              {METRICS.map((m) => (
                <View key={m.key}>
                  <View style={styles.metricRow}>
                    <Text style={styles.metricName}>{m.label}</Text>
                    <Text style={styles.metricVal}>{result.breakdown[m.key]}%</Text>
                  </View>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${result.breakdown[m.key]}%` }]} />
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.card, Shadow.sm]}>
              <Text style={styles.cardTitle}>What This Score Measures</Text>
              <Text style={styles.noteText}>
                This is computed directly from this product&apos;s verified record: {result.tracedIngredients} of{' '}
                {result.totalIngredients} ingredients have a documented botanical/scientific name, all four safety
                and usage fields are checked for completeness, and it is currently stocked by {result.storeCount}{' '}
                {result.storeCount === 1 ? 'store' : 'stores'} in the AyurTrace+ network. It does not represent
                harvest permits, ecological impact, or transport data, since that supply-chain information isn&apos;t
                linked to this product yet.
              </Text>
            </View>
          </>
        )}
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
  loadingWrap: { paddingVertical: Spacing['2xl'], alignItems: 'center' },
  headerCard: {
    backgroundColor: Colors.lightGreen,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    alignItems: 'center',
    marginVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.green + '30',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  scoreText: {
    fontFamily: Fonts.family.serifSemiBold,
    fontSize: Fonts.size['3xl'],
    color: Colors.primary,
  },
  scoreLabel: {
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.size.xs + 1,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  cardTitle: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.base,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metricName: {
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.size.xs + 1,
    color: Colors.text,
  },
  metricVal: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.xs + 1,
    color: Colors.primary,
  },
  barBg: {
    height: 6,
    backgroundColor: Colors.cream,
    borderRadius: 3,
    marginTop: 4,
    marginBottom: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 3,
  },
  noteText: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs + 1,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  errorText: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginTop: Spacing.sm,
  },
});
