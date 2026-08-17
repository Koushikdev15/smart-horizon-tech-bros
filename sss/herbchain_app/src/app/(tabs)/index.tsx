import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors, Fonts, Type, Spacing, BorderRadius, Shadow } from '@/theme';
import { AppHeader, SectionHeader } from '@/components/Header';
import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import { ProductCard } from '@/components/ProductCard';
import { RecallBanner, OfflineBanner } from '@/components/CardsAndInputs';
import Icon from '@/components/Icon';
import { useAuthStore } from '@/store/authStore';
import { useProductStore } from '@/store/productStore';
import { PRODUCTS, getProductById } from '@/data/mockProducts';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { scanHistory, savedProductIds, isSaved, toggleSaved, unreadAlertCount, isOffline } =
    useProductStore();

  const recalledProduct = PRODUCTS.find((p) => p.status === 'recalled');
  const savedProducts = savedProductIds
    .map((id) => getProductById(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <AppHeader
        unreadCount={unreadAlertCount()}
        onNotificationPress={() => router.push('/(tabs)/alerts')}
        onProfilePress={() => router.push('/(tabs)/profile')}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isOffline && <OfflineBanner />}

        {/* Greeting */}
        <View style={styles.greetingBlock}>
          <Text style={styles.greetingTitle}>{t('home.greeting', { name: user?.name || 'Guest' })}</Text>
          <Text style={styles.greetingSub}>{t('home.greetingSub')}</Text>
        </View>

        {/* Hero Card — first-impression focal point, kept ahead of any alerts */}
        <View style={[styles.heroCard, Shadow.lg]}>
          {/* Inner gold hairline — the "seal of authenticity" accent */}
          <View style={styles.heroInnerStroke} pointerEvents="none" />
          <View style={styles.heroLeafBadge}>
            <Icon name="leaf" size={20} color={Colors.gold} />
          </View>

          <Text style={styles.heroTitle}>{t('home.verifyTitle')}</Text>
          <Text style={styles.heroDesc}>{t('home.verifyDesc')}</Text>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>10,000+</Text>
              <Text style={styles.heroStatLabel}>{t('home.verifiedBatches')}</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>100%</Text>
              <Text style={styles.heroStatLabel}>{t('home.blockchainTrackedStat')}</Text>
            </View>
          </View>

          <View style={styles.heroActions}>
            <PrimaryButton
              title={t('home.scanProduct')}
              onPress={() => router.push('/(tabs)/scan')}
              icon="qr-code-outline"
              style={styles.heroPrimaryBtn}
              textStyle={styles.heroPrimaryBtnText}
            />

            <SecondaryButton
              title={t('home.enterBatchId')}
              onPress={() => router.push('/verify/manual')}
              icon="keypad-outline"
              style={styles.heroSecondaryBtn}
              textStyle={styles.heroSecondaryBtnText}
            />
          </View>
        </View>

        {/* Quick Tools Row */}
        <View style={styles.toolsRow}>
          <TouchableOpacity
            style={[styles.toolCard, Shadow.sm]}
            onPress={() => router.push('/copilot')}
          >
            <View style={[styles.toolIcon, { backgroundColor: Colors.secondaryContainer }]}>
              <Icon name="sparkles" size={22} color={Colors.onSecondaryContainer} />
            </View>
            <Text style={styles.toolTitle}>{t('home.askAyurTrace')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolCard, Shadow.sm]}
            onPress={() => router.push('/search')}
          >
            <View style={[styles.toolIcon, { backgroundColor: Colors.surfaceContainerHigh }]}>
              <Icon name="search" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.toolTitle}>{t('home.search')}</Text>
            <Text style={styles.toolSub}>{t('home.searchSub')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolCard, Shadow.sm]}
            onPress={() => router.push('/compare')}
          >
            <View style={[styles.toolIcon, { backgroundColor: Colors.tertiaryFixed }]}>
              <Icon name="git-compare" size={22} color={Colors.onTertiaryFixedVariant} />
            </View>
            <Text style={styles.toolTitle}>{t('home.compare')}</Text>
            <Text style={styles.toolSub}>{t('home.compareSub')}</Text>
          </TouchableOpacity>
        </View>

        {/* Recall notice — deliberately below the primary actions, not the
            first thing a user sees on opening the app. */}
        {recalledProduct && recalledProduct.recall && (
          <RecallBanner
            recall={recalledProduct.recall}
            onPressDetails={() => router.push(`/product/${recalledProduct.id}/recall` as any)}
          />
        )}

        {/* Recent Scans */}
        <SectionHeader
          title={t('home.recentScans')}
          actionText={t('home.viewAll')}
          onActionPress={() => router.push('/(tabs)/history')}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
          {scanHistory.map((item) => {
            const product = getProductById(item.productId);
            if (!product) return null;
            return (
              <ProductCard
                key={item.id}
                product={product}
                variant="compact"
                isBookmarked={isSaved(product.id)}
                onBookmarkPress={() => toggleSaved(product.id)}
                onPress={() => router.push(`/verify/${product.batchId}` as any)}
              />
            );
          })}
        </ScrollView>

        {/* Saved Products */}
        {savedProducts.length > 0 && (
          <>
            <SectionHeader
              title={t('home.savedProducts')}
              actionText={t('home.viewAll')}
              onActionPress={() => router.push('/saved')}
            />

            {savedProducts.slice(0, 2).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isBookmarked={true}
                onBookmarkPress={() => toggleSaved(product.id)}
                onPress={() => router.push(`/product/${product.id}` as any)}
              />
            ))}
          </>
        )}

        {/* Trust Summary Cards */}
        <SectionHeader title={t('home.trustPillars')} />

        <View style={styles.pillarGrid}>
          <View style={[styles.pillarCard, Shadow.sm]}>
            <Icon name="location-outline" size={24} color={Colors.primary} />
            <Text style={styles.pillarTitle}>{t('home.verifiedSources')}</Text>
            <Text style={styles.pillarDesc}>100% Region-tracked Ayurvedic farms</Text>
          </View>

          <View style={[styles.pillarCard, Shadow.sm]}>
            <Icon name="flask-outline" size={24} color={Colors.primary} />
            <Text style={styles.pillarTitle}>{t('home.labVerified')}</Text>
            <Text style={styles.pillarDesc}>NABL accredited purity testing</Text>
          </View>

          <View style={[styles.pillarCard, Shadow.sm]}>
            <Icon name="cube-outline" size={24} color={Colors.primary} />
            <Text style={styles.pillarTitle}>{t('home.blockchainTracked')}</Text>
            <Text style={styles.pillarDesc}>Immutable audit record</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    paddingHorizontal: Spacing.gutter,
    paddingBottom: Spacing['3xl'],
  },
  greetingBlock: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  greetingTitle: {
    ...Type.headlineLgMobile,
    color: Colors.primary,
  },
  greetingSub: {
    ...Type.bodyMd,
    color: Colors.onSurfaceVariant,
    marginTop: Spacing.xs,
  },
  heroCard: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
  },
  heroInnerStroke: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(194,148,40,0.3)',
  },
  heroLeafBadge: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(194,148,40,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    ...Type.headlineMd,
    color: Colors.onPrimary,
    marginBottom: Spacing.sm,
    maxWidth: '80%',
  },
  heroDesc: {
    ...Type.bodyMd,
    color: Colors.onPrimaryContainer,
    marginBottom: Spacing.lg,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  heroStat: { flex: 1 },
  heroStatValue: {
    ...Type.headlineSm,
    color: Colors.gold,
  },
  heroStatLabel: {
    fontFamily: Fonts.family.regular,
    fontSize: 11,
    color: Colors.onPrimaryContainer,
    marginTop: 1,
  },
  heroStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(194,148,40,0.3)',
    marginHorizontal: Spacing.md,
  },
  heroActions: {
    gap: Spacing.md,
  },
  // Ayurvedic Gold reserved for the highest-priority CTA.
  heroPrimaryBtn: {
    backgroundColor: Colors.onTertiaryContainer,
  },
  heroPrimaryBtnText: {
    color: Colors.tertiaryContainer,
  },
  heroSecondaryBtn: {
    borderColor: 'rgba(194,148,40,0.45)',
  },
  heroSecondaryBtnText: {
    color: Colors.onTertiaryContainer,
  },
  toolsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  toolCard: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    alignItems: 'center',
  },
  toolIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  toolTitle: {
    ...Type.labelMd,
    color: Colors.primary,
    textAlign: 'center',
  },
  toolSub: {
    fontFamily: Fonts.family.regular,
    fontSize: 11,
    lineHeight: 15,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
    textAlign: 'center',
  },
  pillarGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.base,
  },
  pillarCard: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    alignItems: 'center',
  },
  pillarTitle: {
    ...Type.labelMd,
    color: Colors.primary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  pillarDesc: {
    fontFamily: Fonts.family.regular,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 15,
  },
});
