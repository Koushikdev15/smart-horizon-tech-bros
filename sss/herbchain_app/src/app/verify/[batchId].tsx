import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Fonts, Type, Spacing, BorderRadius, Shadow } from '@/theme';
import { AppHeader, SectionHeader } from '@/components/Header';
import { TrustScore, StatusBadge, VerificationBadge } from '@/components/Badges';
import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import { BlockchainCard, RecallBanner } from '@/components/CardsAndInputs';
import Icon from '@/components/Icon';
import { getProductByBatchId, PRODUCTS } from '@/data/mockProducts';
import { useProductStore } from '@/store/productStore';

const VERIFICATION_STEPS = [
  'Reading QR...',
  'Checking Product...',
  'Checking Batch...',
  'Checking Source...',
  'Checking Laboratory Records...',
  'Checking Supply Chain...',
  'Checking Blockchain...',
  'Verification Complete',
];

export default function VerificationResultScreen() {
  const router = useRouter();
  const { batchId } = useLocalSearchParams<{ batchId: string }>();

  const { isSaved, toggleSaved, addScan } = useProductStore();

  const product = getProductByBatchId(batchId || '') || PRODUCTS[0];

  const [stepIndex, setStepIndex] = useState(0);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    if (stepIndex < VERIFICATION_STEPS.length - 1) {
      const timer = setTimeout(() => {
        setStepIndex((prev) => prev + 1);
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setIsVerifying(false);
      // Add to scan history
      addScan({
        id: `scan-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        manufacturer: product.manufacturer,
        batchId: product.batchId,
        scanDate: new Date().toISOString().split('T')[0],
        trustScore: product.trustScore,
        status: product.status,
      });
    }
  }, [stepIndex]);

  // If still running verification animation
  if (isVerifying) {
    return (
      <SafeAreaView style={styles.animContainer}>
        <View style={styles.animContent}>
          <View style={styles.pulseCircle}>
            <Icon name="shield-checkmark" size={54} color={Colors.primary} />
          </View>

          <Text style={styles.animTitle}>Verifying Product</Text>
          <Text style={styles.animBatchText}>Batch: {batchId}</Text>

          <View style={styles.stepsCard}>
            {VERIFICATION_STEPS.slice(0, stepIndex + 1).map((stepText, idx) => (
              <View key={stepText} style={styles.stepRow}>
                <Icon
                  name={idx === stepIndex ? 'refresh-circle' : 'checkmark-circle'}
                  size={20}
                  color={idx === stepIndex ? Colors.gold : Colors.success}
                  style={{ marginRight: 10 }}
                />
                <Text
                  style={[
                    styles.stepText,
                    idx === stepIndex && styles.stepTextActive,
                  ]}
                >
                  {stepText}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const isRecalled = product.status === 'recalled';
  const bookmarked = isSaved(product.id);

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        showBack
        onBackPress={() => router.back()}
        title="Verification Result"
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Recalled Banner Notice */}
        {isRecalled && product.recall && (
          <RecallBanner
            recall={product.recall}
            onPressDetails={() => router.push(`/product/${product.id}/recall` as any)}
          />
        )}

        {/* Verification Success Header */}
        {!isRecalled ? (
          <View style={styles.verifiedHeader}>
            {/* Gold-ringed seal of authenticity */}
            <View style={styles.sealRing}>
              <View style={styles.shieldIconBadge}>
                <Icon name="shield-checkmark" size={44} color={Colors.onPrimary} />
              </View>
            </View>
            <Text style={styles.verifiedTitle}>PRODUCT VERIFIED</Text>
            <Text style={styles.verifiedSub}>
              Authenticity confirmed via immutable blockchain record.
            </Text>
          </View>
        ) : (
          <View style={styles.verifiedHeader}>
            <View style={[styles.sealRing, styles.sealRingAlert]}>
              <View style={[styles.shieldIconBadge, styles.shieldIconBadgeAlert]}>
                <Icon name="alert-circle" size={44} color={Colors.onError} />
              </View>
            </View>
            <Text style={[styles.verifiedTitle, { color: Colors.error }]}>PRODUCT RECALLED</Text>
            <Text style={styles.verifiedSub}>
              This product batch has been flagged for recall. Do not consume.
            </Text>
          </View>
        )}

        {/* Product Summary Card */}
        <View style={[styles.prodCard, Shadow.md]}>
          <View style={styles.prodRow}>
            <View style={styles.prodImgBox}>
              <Icon name="medical" size={36} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.prodName}>{product.name}</Text>
              <Text style={styles.prodMfr}>{product.manufacturer}</Text>
              <Text style={styles.prodBatch}>Batch: {product.batchId}</Text>
            </View>

            <TouchableOpacity
              style={styles.bookmarkBtn}
              onPress={() => toggleSaved(product.id)}
            >
              <Icon
                name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={bookmarked ? Colors.gold : Colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Expiry Date: <Text style={styles.metaVal}>{product.expiryDate}</Text></Text>
            <StatusBadge status={product.status} />
          </View>
        </View>

        {/* Trust Score Hero Circle */}
        <View style={[styles.scoreCard, Shadow.md]}>
          <Text style={styles.scoreHeaderTitle}>AyurTrace Trust Score</Text>
          <View style={styles.scoreCircleWrapper}>
            <TrustScore score={product.trustScore} size="lg" showLabel />
          </View>

          <Text style={styles.scoreDisclaimer}>
            Trust Score summarizes available source, laboratory, documentation and traceability records. It is not a medical effectiveness rating.
          </Text>

          <View style={styles.breakdownBox}>
            <Text style={styles.breakdownTitle}>Score Breakdown</Text>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Source Verification</Text>
              <Text style={styles.progressVal}>{product.trustBreakdown.sourceVerification}%</Text>
            </View>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Laboratory Verification</Text>
              <Text style={styles.progressVal}>{product.trustBreakdown.labVerification}%</Text>
            </View>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Traceability</Text>
              <Text style={styles.progressVal}>{product.trustBreakdown.traceability}%</Text>
            </View>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Documentation</Text>
              <Text style={styles.progressVal}>{product.trustBreakdown.documentation}%</Text>
            </View>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Sustainability</Text>
              <Text style={styles.progressVal}>{product.trustBreakdown.sustainability}%</Text>
            </View>
          </View>
        </View>

        {/* Quick Verification Checklist Card */}
        <View style={[styles.checklistCard, Shadow.sm]}>
          <Text style={styles.checklistTitle}>Quick Verification Checklist</Text>
          <View style={styles.checklistGrid}>
            <VerificationBadge label="Source Verified" verified={product.quickVerification.sourceVerified} />
            <VerificationBadge label="Laboratory Verified" verified={product.quickVerification.labVerified} />
            <VerificationBadge label="Manufacturer Verified" verified={product.quickVerification.manufacturerVerified} />
            <VerificationBadge label="Supply Chain Verified" verified={product.quickVerification.supplyChainVerified} />
            <VerificationBadge label="QR Code Verified" verified={product.quickVerification.qrVerified} />
            <VerificationBadge label="Blockchain Record" verified={product.quickVerification.blockchainAvailable} />
          </View>
        </View>

        {/* Action Buttons */}
        <PrimaryButton
          title="Explore Full Product Details"
          onPress={() => router.push(`/product/${product.id}` as any)}
          icon="arrow-forward"
          iconPosition="right"
          size="lg"
          style={{ marginBottom: Spacing.sm }}
        />

        <SecondaryButton
          title="Ask AyurTrace+ About This Product"
          onPress={() => router.push({ pathname: '/copilot', params: { productName: product.name } } as any)}
          icon="sparkles-outline"
          size="lg"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  animContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animContent: {
    width: '85%',
    alignItems: 'center',
  },
  pulseCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.onTertiaryContainer,
  },
  animTitle: {
    ...Type.headlineMd,
    color: Colors.primary,
  },
  animBatchText: {
    ...Type.bodySm,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.xl,
  },
  stepsCard: {
    width: '100%',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    ...Shadow.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  stepText: {
    ...Type.bodySm,
    color: Colors.outline,
  },
  stepTextActive: {
    fontFamily: Fonts.family.semiBold,
    color: Colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    paddingHorizontal: Spacing.gutter,
    paddingBottom: Spacing['3xl'],
  },
  // Verdict sits directly on the ivory canvas — no card — so the seal reads
  // as the single focal point of the screen.
  verifiedHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  sealRing: {
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 2,
    borderColor: Colors.onTertiaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  sealRingAlert: {
    borderColor: Colors.error,
  },
  shieldIconBadge: {
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldIconBadgeAlert: {
    backgroundColor: Colors.error,
  },
  verifiedTitle: {
    ...Type.headlineLgMobile,
    color: Colors.primary,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  verifiedSub: {
    ...Type.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  prodCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.base,
  },
  prodRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prodImgBox: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.base,
  },
  prodName: {
    ...Type.headlineSm,
    color: Colors.primary,
  },
  prodMfr: {
    ...Type.bodySm,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  // Batch identifiers get the monospaced-style boxed treatment from the spec.
  prodBatch: {
    ...Type.labelCaps,
    color: Colors.outline,
    marginTop: 4,
  },
  bookmarkBtn: {
    padding: 6,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.outlineVariant,
    opacity: 0.6,
    marginVertical: Spacing.base,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    ...Type.bodySm,
    color: Colors.onSurfaceVariant,
  },
  metaVal: {
    ...Type.labelMd,
    color: Colors.primary,
  },
  scoreCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  scoreHeaderTitle: {
    ...Type.labelCaps,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.base,
  },
  scoreCircleWrapper: {
    marginVertical: Spacing.xs,
  },
  scoreDisclaimer: {
    ...Type.bodySm,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginVertical: Spacing.base,
  },
  breakdownBox: {
    width: '100%',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
  },
  breakdownTitle: {
    ...Type.labelCaps,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.sm,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  progressLabel: {
    ...Type.bodySm,
    color: Colors.onSurfaceVariant,
  },
  progressVal: {
    ...Type.labelMd,
    color: Colors.secondary,
  },
  checklistCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.base,
  },
  checklistTitle: {
    ...Type.headlineSm,
    color: Colors.primary,
    marginBottom: Spacing.base,
  },
  checklistGrid: {
    gap: Spacing.sm,
  },
});
