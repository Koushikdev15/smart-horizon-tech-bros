import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '@/theme';
import { AppHeader } from '@/components/Header';
import Icon from '@/components/Icon';
import { getProductById, PRODUCTS } from '@/data/mockProducts';

export default function BlockchainScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const product = getProductById(id || '') || PRODUCTS[0];
  const { blockchain } = product;

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showBack onBackPress={() => router.back()} title="Blockchain Verification" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Header */}
        <View style={[styles.headerCard, Shadow.md]}>
          <View style={styles.goldBadge}>
            <Icon name="cube" size={32} color={Colors.gold} />
          </View>
          <Text style={styles.statusTitle}>
            {blockchain.verified ? 'Blockchain Verified ✓' : 'Unverified Record ⚠️'}
          </Text>
          <Text style={styles.networkSub}>{blockchain.network || 'AyurTrace Polygon Network'}</Text>
        </View>

        {/* Technical Ledger Specs */}
        <View style={[styles.card, Shadow.sm]}>
          <Text style={styles.cardTitle}>Technical Ledger Data</Text>

          <View style={styles.fieldItem}>
            <Text style={styles.fieldLabel}>Transaction Reference</Text>
            <Text style={styles.fieldValMono}>{blockchain.transactionRef || 'N/A'}</Text>
          </View>

          <View style={styles.fieldItem}>
            <Text style={styles.fieldLabel}>Transaction ID (TX Hash)</Text>
            <Text style={styles.fieldValMono}>{blockchain.transactionId || 'N/A'}</Text>
          </View>

          <View style={styles.fieldItem}>
            <Text style={styles.fieldLabel}>Block Number</Text>
            <Text style={styles.fieldValMono}>{blockchain.blockNumber || 'N/A'}</Text>
          </View>

          <View style={styles.fieldItem}>
            <Text style={styles.fieldLabel}>Record Cryptographic Hash</Text>
            <Text style={styles.fieldValMono}>{blockchain.recordHash || 'N/A'}</Text>
          </View>

          <View style={styles.fieldItem}>
            <Text style={styles.fieldLabel}>Timestamp</Text>
            <Text style={styles.fieldVal}>{blockchain.timestamp || 'N/A'}</Text>
          </View>
        </View>

        {/* Immutability Note */}
        <View style={[styles.card, Shadow.sm]}>
          <Text style={styles.cardTitle}>About Blockchain Traceability</Text>
          <Text style={styles.noteText}>
            Every stage of this batch (herb source, lab testing, manufacturing) is cryptographically signed and stored on a decentralized ledger. Records cannot be altered, forged, or backdated.
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
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    alignItems: 'center',
    marginVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gold + '40',
  },
  goldBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.gold + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statusTitle: {
    fontFamily: Fonts.family.serifSemiBold,
    fontSize: Fonts.size.lg,
    color: Colors.text,
  },
  networkSub: {
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.size.xs + 1,
    color: Colors.gold,
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
  fieldItem: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  fieldVal: {
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.size.xs + 1,
    color: Colors.text,
  },
  fieldValMono: {
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.size.xs,
    color: Colors.primary,
    backgroundColor: Colors.cream,
    padding: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noteText: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs + 1,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
