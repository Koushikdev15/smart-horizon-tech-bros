import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '@/theme';
import { AppHeader } from '@/components/Header';
import { StatusBadge, TrustScore } from '@/components/Badges';
import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import { IngredientCard } from '@/components/IngredientCard';
import { LabResultCard, Timeline } from '@/components/LabAndTimeline';
import { BlockchainCard, RecallBanner } from '@/components/CardsAndInputs';
import Icon from '@/components/Icon';
import { getProductById, PRODUCTS } from '@/data/mockProducts';
import { useProductStore } from '@/store/productStore';

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isSaved, toggleSaved } = useProductStore();

  const product = getProductById(id || '') || PRODUCTS[0];
  const bookmarked = isSaved(product.id);

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        showBack
        onBackPress={() => router.back()}
        title={product.name}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Recall Banner if applicable */}
        {product.status === 'recalled' && product.recall && (
          <RecallBanner
            recall={product.recall}
            onPressDetails={() => router.push(`/product/${product.id}/recall` as any)}
          />
        )}

        {/* Hero Product Details */}
        <View style={[styles.heroCard, Shadow.md]}>
          <View style={styles.heroRow}>
            <View style={styles.imgBox}>
              <Icon name="medical" size={40} color={Colors.primary} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.nameText}>{product.name}</Text>
              <Text style={styles.mfrText}>{product.manufacturer}</Text>
              <View style={styles.badgeRow}>
                <StatusBadge status={product.status} size="sm" />
              </View>
            </View>

            <TouchableOpacity
              style={styles.bookmarkBtn}
              onPress={() => toggleSaved(product.id)}
            >
              <Icon
                name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={bookmarked ? Colors.gold : Colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.scoreRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.scoreTitle}>AyurTrace Trust Score</Text>
              <Text style={styles.scoreDesc}>Verified across 5 blockchain pillars</Text>
            </View>
            <TrustScore score={product.trustScore} size="md" showLabel />
          </View>
        </View>

        {/* Product Specifications */}
        <View style={[styles.specCard, Shadow.sm]}>
          <Text style={styles.sectionTitle}>Product Specifications</Text>

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.specLabel}>Batch Number</Text>
              <Text style={styles.specVal}>{product.batchId}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.specLabel}>Product Type</Text>
              <Text style={styles.specVal}>{product.type}</Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.specLabel}>Manufacturing Date</Text>
              <Text style={styles.specVal}>{product.manufacturingDate}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.specLabel}>Expiry Date</Text>
              <Text style={styles.specVal}>{product.expiryDate}</Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.specLabel}>Net Quantity</Text>
              <Text style={styles.specVal}>{product.netQuantity}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.specLabel}>Formulation</Text>
              <Text style={styles.specVal}>{product.formulation}</Text>
            </View>
          </View>
        </View>

        {/* Feature Navigation Tiles */}
        <Text style={styles.sectionHeader}>Explore Product Journey</Text>

        <TouchableOpacity
          style={[styles.tileCard, Shadow.sm]}
          onPress={() => router.push(`/product/${product.id}/ingredients` as any)}
        >
          <View style={[styles.tileIcon, { backgroundColor: Colors.secondaryContainer }]}>
            <Icon name="leaf" size={22} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tileTitle}>What's Inside? (Ingredients)</Text>
            <Text style={styles.tileSub}>{product.ingredients.length} Botanical Ingredients Verified</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tileCard, Shadow.sm]}
          onPress={() => router.push(`/product/${product.id}/origin` as any)}
        >
          <View style={[styles.tileIcon, { backgroundColor: Colors.surfaceContainerHigh }]}>
            <Icon name="location" size={22} color="#2563EB" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tileTitle}>Where Did It Come From? (Origin)</Text>
            <Text style={styles.tileSub}>{product.origin.sourceRegion}, {product.origin.state}</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tileCard, Shadow.sm]}
          onPress={() => router.push(`/product/${product.id}/timeline` as any)}
        >
          <View style={[styles.tileIcon, { backgroundColor: '#F5H8E0' }]} >
            <Icon name="git-commit" size={22} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tileTitle}>Complete Traceability Timeline</Text>
            <Text style={styles.tileSub}>{product.timeline.length} Stages Verified</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tileCard, Shadow.sm]}
          onPress={() => router.push(`/product/${product.id}/laboratory` as any)}
        >
          <View style={[styles.tileIcon, { backgroundColor: Colors.surfaceContainerHigh }]}>
            <Icon name="flask" size={22} color="#DB2777" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tileTitle}>Laboratory Quality Report</Text>
            <Text style={styles.tileSub}>{product.labResults.length} Quality Tests Passed</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tileCard, Shadow.sm]}
          onPress={() => router.push(`/product/${product.id}/blockchain` as any)}
        >
          <View style={[styles.tileIcon, { backgroundColor: Colors.tertiaryFixed }]}>
            <Icon name="cube" size={22} color={Colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tileTitle}>Blockchain Verification</Text>
            <Text style={styles.tileSub}>Immutable Polygon Network Record</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tileCard, Shadow.sm]}
          onPress={() => router.push(`/product/${product.id}/sustainability` as any)}
        >
          <View style={[styles.tileIcon, { backgroundColor: Colors.secondaryContainer }]}>
            <Icon name="globe-outline" size={22} color={Colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tileTitle}>Sustainability Score</Text>
            <Text style={styles.tileSub}>{product.sustainability.score} / 100 Responsible Rating</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tileCard, Shadow.sm]}
          onPress={() => router.push(`/product/${product.id}/safety` as any)}
        >
          <View style={[styles.tileIcon, { backgroundColor: Colors.errorContainer }]}>
            <Icon name="shield-outline" size={22} color={Colors.error} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tileTitle}>Safety & Usage Information</Text>
            <Text style={styles.tileSub}>Storage, Warnings & Contraindications</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* AI Copilot CTA */}
        <View style={styles.copilotCtaBox}>
          <Icon name="sparkles" size={28} color={Colors.gold} />
          <Text style={styles.copilotCtaTitle}>Have questions about this product?</Text>
          <Text style={styles.copilotCtaSub}>
            Ask AyurTrace Copilot to explain lab reports, botanical ingredients, or the traceability timeline.
          </Text>

          <PrimaryButton
            title="Ask AyurTrace Copilot"
            onPress={() => router.push('/copilot')}
            icon="sparkles"
            style={{ marginTop: Spacing.md }}
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
  heroCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    marginVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imgBox: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius['2xl'],
    backgroundColor: Colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  nameText: {
    fontFamily: Fonts.family.serifSemiBold,
    fontSize: Fonts.size.xl,
    color: Colors.text,
  },
  mfrText: {
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badgeRow: {
    marginTop: 6,
  },
  bookmarkBtn: {
    padding: 6,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.md,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreTitle: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.base,
    color: Colors.text,
  },
  scoreDesc: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  specCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  sectionTitle: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.base,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm + 2,
  },
  gridCol: {
    flex: 1,
  },
  specLabel: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
  },
  specVal: {
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.size.xs + 1,
    color: Colors.text,
    marginTop: 2,
  },
  sectionHeader: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.base,
    color: Colors.text,
    marginBottom: Spacing.sm + 2,
    marginLeft: 4,
  },
  tileCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  tileTitle: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.sm + 1,
    color: Colors.text,
  },
  tileSub: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  copilotCtaBox: {
    backgroundColor: Colors.darkGreen,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  copilotCtaTitle: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.base,
    color: Colors.white,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  copilotCtaSub: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs + 1,
    color: Colors.lightGreen,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});
