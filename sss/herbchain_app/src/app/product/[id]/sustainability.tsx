import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '@/theme';
import { AppHeader } from '@/components/Header';
import Icon from '@/components/Icon';
import { getProductById, PRODUCTS } from '@/data/mockProducts';

export default function SustainabilityScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const product = getProductById(id || '') || PRODUCTS[0];
  const { sustainability } = product;

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showBack onBackPress={() => router.back()} title="Sustainability Rating" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Score Header */}
        <View style={[styles.headerCard, Shadow.md]}>
          <View style={styles.iconCircle}>
            <Icon name="globe-outline" size={32} color={Colors.success} />
          </View>
          <Text style={styles.scoreText}>{sustainability.score} / 100</Text>
          <Text style={styles.scoreLabel}>Responsible Sourcing & Ecological Rating</Text>
        </View>

        {/* Breakdown Card */}
        <View style={[styles.card, Shadow.sm]}>
          <Text style={styles.cardTitle}>Pillar Breakdown</Text>

          <View style={styles.metricRow}>
            <Text style={styles.metricName}>Responsible Sourcing</Text>
            <Text style={styles.metricVal}>{sustainability.responsibleSourcing}%</Text>
          </View>
          <View style={styles.barBg}><View style={[styles.barFill, { width: `${sustainability.responsibleSourcing}%` }]} /></View>

          <View style={styles.metricRow}>
            <Text style={styles.metricName}>Collection Compliance</Text>
            <Text style={styles.metricVal}>{sustainability.collectionCompliance}%</Text>
          </View>
          <View style={styles.barBg}><View style={[styles.barFill, { width: `${sustainability.collectionCompliance}%` }]} /></View>

          <View style={styles.metricRow}>
            <Text style={styles.metricName}>Ecological Risk Index</Text>
            <Text style={styles.metricVal}>{sustainability.ecologicalRisk}%</Text>
          </View>
          <View style={styles.barBg}><View style={[styles.barFill, { width: `${sustainability.ecologicalRisk}%` }]} /></View>

          <View style={styles.metricRow}>
            <Text style={styles.metricName}>Low-Emission Transport</Text>
            <Text style={styles.metricVal}>{sustainability.transport}%</Text>
          </View>
          <View style={styles.barBg}><View style={[styles.barFill, { width: `${sustainability.transport}%` }]} /></View>

          <View style={styles.metricRow}>
            <Text style={styles.metricName}>Documentation Completeness</Text>
            <Text style={styles.metricVal}>{sustainability.documentation}%</Text>
          </View>
          <View style={styles.barBg}><View style={[styles.barFill, { width: `${sustainability.documentation}%` }]} /></View>
        </View>

        {/* Note */}
        <View style={[styles.card, Shadow.sm]}>
          <Text style={styles.cardTitle}>Supported Sustainability Claims</Text>
          <Text style={styles.noteText}>
            Only sustainability metrics backed by actual harvest permits, collection receipts, and transport logs are calculated into the score.
          </Text>
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
});
