import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '@/theme';
import { AppHeader } from '@/components/Header';
import { PrimaryButton } from '@/components/Buttons';
import Icon from '@/components/Icon';
import { getProductById, PRODUCTS } from '@/data/mockProducts';

export default function RecallNoticeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const product = getProductById(id || '') || PRODUCTS[3]; // Default to recalled product demo
  const recall = product.recall || {
    recallDate: '2026-05-15',
    reason: 'Elevated heavy metal levels (lead, mercury) exceeding safe limits.',
    severity: 'Critical',
    recommendedAction: 'Discontinue use immediately. Return product to place of purchase.',
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showBack onBackPress={() => router.back()} title="Product Recall Notice" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Red Warning Banner Header */}
        <View style={[styles.alertHeader, Shadow.md]}>
          <View style={styles.alertIconCircle}>
            <Icon name="warning" size={40} color={Colors.white} />
          </View>
          <Text style={styles.alertTitle}>PRODUCT RECALL NOTICE</Text>
          <Text style={styles.alertSub}>Immediate Action Required for Affected Batch</Text>
        </View>

        {/* Affected Batch Summary */}
        <View style={[styles.card, Shadow.sm]}>
          <Text style={styles.cardTitle}>Affected Product</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Product Name</Text>
            <Text style={styles.val}>{product.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Manufacturer</Text>
            <Text style={styles.val}>{product.manufacturer}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Batch ID</Text>
            <Text style={[styles.val, { color: Colors.error }]}>{product.batchId}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Recall Issued Date</Text>
            <Text style={styles.val}>{recall.recallDate}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Severity Level</Text>
            <View style={styles.severityBadge}>
              <Text style={styles.severityText}>{recall.severity}</Text>
            </View>
          </View>
        </View>

        {/* Recall Reason */}
        <View style={[styles.card, Shadow.sm]}>
          <Text style={styles.cardTitle}>Reason for Recall</Text>
          <Text style={styles.bodyText}>{recall.reason}</Text>
        </View>

        {/* Recommended Customer Action */}
        <View style={[styles.card, { borderColor: Colors.error + '40' }, Shadow.sm]}>
          <Text style={[styles.cardTitle, { color: Colors.error }]}>Recommended Action</Text>
          <Text style={styles.bodyText}>{recall.recommendedAction}</Text>
        </View>

        {/* Report Product CTA */}
        <PrimaryButton
          title="Report This Recalled Product"
          onPress={() => router.push('/report')}
          icon="flag"
          style={{ backgroundColor: Colors.error, marginTop: Spacing.md }}
        />
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
  alertHeader: {
    backgroundColor: Colors.error,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  alertIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  alertTitle: {
    fontFamily: Fonts.family.serifSemiBold,
    fontSize: Fonts.size.xl,
    color: Colors.white,
    letterSpacing: 1,
  },
  alertSub: {
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.size.xs + 1,
    color: Colors.white,
    opacity: 0.9,
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  label: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs + 1,
    color: Colors.textMuted,
  },
  val: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.xs + 1,
    color: Colors.text,
  },
  severityBadge: {
    backgroundColor: Colors.errorContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  severityText: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.xs,
    color: Colors.error,
  },
  bodyText: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs + 1,
    color: Colors.text,
    lineHeight: 20,
  },
});
