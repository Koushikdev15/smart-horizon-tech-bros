import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Colors, Fonts, Type, Spacing, BorderRadius, Shadow } from '@/theme';
import { AppHeader } from '@/components/Header';
import { StatusBadge, TrustScore } from '@/components/Badges';
import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import { IngredientCard } from '@/components/IngredientCard';
import { LabResultCard, Timeline } from '@/components/LabAndTimeline';
import { BlockchainCard, RecallBanner } from '@/components/CardsAndInputs';
import Icon from '@/components/Icon';
import { getProductById, PRODUCTS } from '@/data/mockProducts';
import { useProductStore } from '@/store/productStore';
import { ApiError } from '@/lib/api';
import { productService, type SuitabilityResult } from '@/services/productService';
import { storeService, type NearbyStore } from '@/services/storeService';
import { useAuthStore } from '@/store/authStore';

const VERDICT_STYLE: Record<SuitabilityResult['verdict'], { bg: string; fg: string; icon: 'checkmark-circle' | 'alert-circle' | 'warning' | 'help-circle-outline' }> = {
  NO_KNOWN_CONFLICT: { bg: Colors.secondaryContainer, fg: Colors.onSecondaryContainer, icon: 'checkmark-circle' },
  POTENTIAL_CONCERN: { bg: Colors.tertiaryFixed, fg: Colors.onTertiaryFixedVariant, icon: 'alert-circle' },
  HIGH_RISK_MATCH: { bg: Colors.errorContainer, fg: Colors.onErrorContainer, icon: 'warning' },
  INSUFFICIENT_INFORMATION: { bg: Colors.surfaceContainerHigh, fg: Colors.onSurfaceVariant, icon: 'help-circle-outline' },
};

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isSaved, toggleSaved } = useProductStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isGuest = useAuthStore((s) => s.isGuest);

  const product = getProductById(id || '') || PRODUCTS[0];
  const bookmarked = isSaved(product.id);

  const [suitability, setSuitability] = useState<SuitabilityResult | null>(null);
  const [suitabilityError, setSuitabilityError] = useState<string | null>(null);
  const [checkingSuitability, setCheckingSuitability] = useState(false);

  async function handleCheckSuitability() {
    if (!isAuthenticated || isGuest) {
      setSuitabilityError('Sign in to check this product against your health profile.');
      return;
    }
    setCheckingSuitability(true);
    setSuitabilityError(null);
    setSuitability(null);
    try {
      // Bridges this screen's demo product catalog to the real backend by
      // name — a genuine lookup, not a fake one, but it only finds a match
      // once a real Product with a matching name exists in the database.
      const result = await productService.checkSuitability({ productName: product.name });
      setSuitability(result);
    } catch (err) {
      setSuitabilityError(
        err instanceof ApiError && err.status === 404
          ? "This demo product isn't linked to a live AyurTrace+ product record yet."
          : err instanceof ApiError
            ? err.message
            : 'Could not run the suitability check. Please try again.'
      );
    } finally {
      setCheckingSuitability(false);
    }
  }

  const [stores, setStores] = useState<NearbyStore[] | null>(null);
  const [storesError, setStoresError] = useState<string | null>(null);
  const [findingStores, setFindingStores] = useState(false);

  async function handleFindNearbyStores() {
    if (!suitability) return;
    setFindingStores(true);
    setStoresError(null);
    setStores(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setStoresError('Location permission is needed to find nearby stores.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const results = await storeService.findNearby({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        productId: suitability.product._id,
      });
      setStores(results);
    } catch (err) {
      setStoresError(err instanceof ApiError ? err.message : "Couldn't find nearby stores. Please try again.");
    } finally {
      setFindingStores(false);
    }
  }

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

        {/* Check Product Suitability */}
        <View style={[styles.suitabilityCard, Shadow.sm]}>
          <View style={styles.suitabilityHeaderRow}>
            <Icon name="shield-checkmark-outline" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Check Product Suitability</Text>
          </View>
          <Text style={styles.suitabilityDesc}>
            Compare this product&apos;s ingredients against your Health Profile for allergy conflicts and documented
            precautions.
          </Text>

          {!suitability && !suitabilityError && (
            <PrimaryButton
              title={checkingSuitability ? 'Checking…' : 'Check Product Suitability'}
              onPress={handleCheckSuitability}
              loading={checkingSuitability}
              icon="shield-checkmark-outline"
              style={{ marginTop: Spacing.md }}
            />
          )}

          {suitabilityError && (
            <>
              <View style={styles.suitabilityErrorBox}>
                <Icon name="information-circle-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.suitabilityErrorText}>{suitabilityError}</Text>
              </View>
              {!isAuthenticated || isGuest ? (
                <SecondaryButton title="Sign In" onPress={() => router.push('/login')} style={{ marginTop: Spacing.md }} />
              ) : (
                <SecondaryButton title="Try Again" onPress={handleCheckSuitability} style={{ marginTop: Spacing.md }} />
              )}
            </>
          )}

          {suitability && (
            <View style={{ marginTop: Spacing.md }}>
              <View style={[styles.verdictBadge, { backgroundColor: VERDICT_STYLE[suitability.verdict].bg }]}>
                <Icon name={VERDICT_STYLE[suitability.verdict].icon} size={16} color={VERDICT_STYLE[suitability.verdict].fg} />
                <Text style={[styles.verdictBadgeText, { color: VERDICT_STYLE[suitability.verdict].fg }]}>
                  {suitability.verdictLabel}
                </Text>
              </View>
              <Text style={styles.suitabilityExplanation}>{suitability.explanation}</Text>

              {!suitability.hasHealthProfile && (
                <TouchableOpacity onPress={() => router.push('/settings/health-profile' as any)}>
                  <Text style={styles.suitabilityHint}>
                    Add your Health Profile for a personalized allergy check →
                  </Text>
                </TouchableOpacity>
              )}

              {suitability.doctorGuidance.length > 0 && (
                <View style={styles.guidanceList}>
                  {suitability.doctorGuidance.map((g) => (
                    <View key={g.guidanceId} style={styles.guidanceRow}>
                      <Icon name="ribbon-outline" size={14} color={Colors.gold} />
                      <Text style={styles.guidanceText}>
                        &quot;{g.title}&quot; — reviewed by Dr. {g.doctorName}, verified by AyurTrace+
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <SecondaryButton title="Check Again" onPress={handleCheckSuitability} style={{ marginTop: Spacing.md }} />
            </View>
          )}
        </View>

        {/* Find Nearby Stores — only once suitability has resolved a real product */}
        {suitability && (
          <View style={[styles.suitabilityCard, Shadow.sm]}>
            <View style={styles.suitabilityHeaderRow}>
              <Icon name="storefront-outline" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Find Nearby Stores</Text>
            </View>
            <Text style={styles.suitabilityDesc}>
              See which nearby stores currently have {suitability.product.productName} in stock.
            </Text>

            <PrimaryButton
              title={findingStores ? 'Finding stores…' : 'Find Nearby Stores'}
              onPress={handleFindNearbyStores}
              loading={findingStores}
              icon="navigate-outline"
              style={{ marginTop: Spacing.md }}
            />

            {storesError && (
              <View style={styles.suitabilityErrorBox}>
                <Icon name="information-circle-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.suitabilityErrorText}>{storesError}</Text>
              </View>
            )}

            {stores && stores.length === 0 && (
              <Text style={[styles.suitabilityDesc, { marginTop: Spacing.md }]}>
                No nearby stores currently have this product in stock.
              </Text>
            )}

            {stores && stores.length > 0 && (
              <View style={styles.guidanceList}>
                {stores.map((s) => (
                  <View key={s._id} style={styles.storeRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.storeName}>{s.name}</Text>
                      <Text style={styles.storeAddress}>{s.address}</Text>
                      {s.inventory?.price != null && (
                        <Text style={styles.storePrice}>₹{s.inventory.price}</Text>
                      )}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.storeDistance}>{s.distanceKm} km</Text>
                      {s.isOpenNow !== null && (
                        <Text style={[styles.storeOpenStatus, { color: s.isOpenNow ? Colors.secondary : Colors.error }]}>
                          {s.isOpenNow ? 'Open now' : 'Closed'}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* AI Copilot CTA */}
        <View style={styles.copilotCtaBox}>
          <Icon name="sparkles" size={28} color={Colors.gold} />
          <Text style={styles.copilotCtaTitle}>Have questions about this product?</Text>
          <Text style={styles.copilotCtaSub}>
            Ask AyurTrace+ to explain lab reports, botanical ingredients, product suitability, or the traceability timeline.
          </Text>

          <PrimaryButton
            title="Ask AyurTrace+"
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
  suitabilityCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  suitabilityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  suitabilityDesc: {
    ...Type.bodySm,
    color: Colors.textSecondary,
  },
  suitabilityErrorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.lightGreen + '80',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  suitabilityErrorText: {
    ...Type.bodySm,
    color: Colors.primary,
    flex: 1,
  },
  verdictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  verdictBadgeText: {
    ...Type.labelMd,
    fontSize: 12,
  },
  suitabilityExplanation: {
    ...Type.bodySm,
    color: Colors.text,
    lineHeight: 20,
  },
  suitabilityHint: {
    ...Type.bodySm,
    color: Colors.primary,
    fontFamily: Fonts.family.semiBold,
    marginTop: Spacing.md,
  },
  guidanceList: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  guidanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  guidanceText: {
    ...Type.bodySm,
    color: Colors.textSecondary,
    flex: 1,
  },
  storeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
  },
  storeName: {
    ...Type.labelMd,
    color: Colors.onSurface,
  },
  storeAddress: {
    ...Type.bodySm,
    color: Colors.textMuted,
    marginTop: 1,
  },
  storePrice: {
    ...Type.labelMd,
    color: Colors.primary,
    marginTop: 2,
  },
  storeDistance: {
    ...Type.labelMd,
    color: Colors.onSurface,
  },
  storeOpenStatus: {
    ...Type.bodySm,
    fontSize: 11,
    marginTop: 1,
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
