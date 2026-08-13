import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, BorderRadius } from '@/theme';
import { AppHeader } from '@/components/Header';
import { Timeline } from '@/components/LabAndTimeline';
import { getProductById, PRODUCTS } from '@/data/mockProducts';

export default function TraceabilityTimelineScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const product = getProductById(id || '') || PRODUCTS[0];

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showBack onBackPress={() => router.back()} title="Complete Traceability" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerInfoBox}>
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.batch}>Batch: {product.batchId}</Text>
          <Text style={styles.desc}>
            7-Stage verified supply chain journey recorded on AyurTrace+ immutable ledger.
          </Text>
        </View>

        <Timeline events={product.timeline} />
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
  headerInfoBox: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    marginVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  title: {
    fontFamily: Fonts.family.serifSemiBold,
    fontSize: Fonts.size.lg,
    color: Colors.text,
  },
  batch: {
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.size.xs + 1,
    color: Colors.primary,
    marginTop: 2,
  },
  desc: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs + 1,
    color: Colors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
});
