import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '@/theme';
import { AppHeader } from '@/components/Header';
import Icon from '@/components/Icon';
import { useCartStore } from '@/store/cartStore';
import { useToastStore } from '@/store/toastStore';
import { useAuthStore } from '@/store/authStore';
import { ApiError } from '@/lib/api';
import { ebuyService, type PurchaseProduct, type StoreOffer } from '@/services/ebuyService';
import { estimateDelivery } from '@/lib/deliveryEstimate';

export default function EBuyProductDetailScreen() {
  const router = useRouter();
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const addItem = useCartStore((s) => s.addItem);
  const userAddress = useAuthStore((s) => s.user?.address);

  const [product, setProduct] = useState<PurchaseProduct | null>(null);
  const [offers, setOffers] = useState<StoreOffer[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [productResult, offersResult] = await Promise.all([
          ebuyService.getById(productId),
          ebuyService.getOffers(productId),
        ]);
        if (cancelled) return;
        setProduct(productResult);
        setOffers(offersResult);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof ApiError ? err.message : 'Could not load this product.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  function handleAddToCart(offer: StoreOffer) {
    if (!product || offer.price == null) return;
    addItem(
      {
        productId: product._id,
        productName: product.productName,
        storeId: offer.storeId,
        storeName: offer.storeName,
        storeRegion: offer.region,
        unitPrice: offer.price,
      },
      1
    );
    useToastStore.getState().show(`Added ${product.productName} to cart`, 'success');
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <AppHeader showBack onBackPress={() => router.back()} title="Product Details" />

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : loadError || !product ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{loadError || 'Product not found.'}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{product.productName}</Text>

          {product.healthTopics.length > 0 && (
            <View style={styles.topicsRow}>
              {product.healthTopics.map((topic) => (
                <View key={topic} style={styles.topicChip}>
                  <Text style={styles.topicChipText}>{topic}</Text>
                </View>
              ))}
            </View>
          )}

          {product.description ? <Text style={styles.detailText}>{product.description}</Text> : null}

          {product.ingredients.length > 0 && (
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ingredients: </Text>
              {product.ingredients.map((i) => (i.scientificName ? `${i.name} (${i.scientificName})` : i.name)).join(', ')}
            </Text>
          )}
          {product.usageInstructions ? (
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>Usage: </Text>
              {product.usageInstructions}
            </Text>
          ) : null}
          {product.precautions ? (
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>Precautions: </Text>
              {product.precautions}
            </Text>
          ) : null}
          {product.contraindications ? (
            <Text style={[styles.detailRow, { color: Colors.error }]}>
              <Text style={styles.detailLabel}>Contraindications: </Text>
              {product.contraindications}
            </Text>
          ) : null}

          <Text style={styles.sectionTitle}>Available From</Text>
          {!offers || offers.length === 0 ? (
            <Text style={styles.emptyText}>No stores currently stock this product.</Text>
          ) : (
            offers.map((offer) => (
              <View key={offer.storeId} style={styles.offerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.offerStoreName}>{offer.storeName}</Text>
                  <Text style={styles.offerAddress}>{offer.address}</Text>
                  {offer.isOpenNow !== null && (
                    <Text style={[styles.offerStatus, { color: offer.isOpenNow ? Colors.secondary : Colors.error }]}>
                      {offer.isOpenNow ? 'Open now' : 'Closed'}
                    </Text>
                  )}
                  {offer.price != null && (
                    <View style={styles.deliveryRow}>
                      <Icon name="bicycle-outline" size={12} color={Colors.textMuted} />
                      <Text style={styles.deliveryText}>{estimateDelivery(offer.region, userAddress)}</Text>
                    </View>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.offerPrice}>{offer.price != null ? `₹${offer.price}` : '—'}</Text>
                  <TouchableOpacity style={styles.addBtn} onPress={() => handleAddToCart(offer)} disabled={offer.price == null}>
                    <Text style={styles.addBtnText}>Add to Cart</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          <Text style={styles.footerNote}>
            Products are purchased through your cart — add items from any store above, then check out from the cart.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  errorText: { fontFamily: Fonts.family.regular, fontSize: Fonts.size.sm, color: Colors.error, textAlign: 'center' },
  scrollContent: { padding: Spacing.gutter, paddingBottom: Spacing['3xl'] },
  title: { fontFamily: Fonts.family.serifSemiBold, fontSize: Fonts.size.xl, color: Colors.primary, marginBottom: Spacing.sm },
  topicsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.sm },
  topicChip: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  topicChipText: { fontFamily: Fonts.family.medium, fontSize: 11, color: Colors.onSecondaryContainer },
  detailText: { fontFamily: Fonts.family.regular, fontSize: Fonts.size.sm, color: Colors.textSecondary, marginBottom: Spacing.sm, lineHeight: 20 },
  detailRow: { fontFamily: Fonts.family.regular, fontSize: Fonts.size.sm, color: Colors.textSecondary, marginBottom: Spacing.sm, lineHeight: 19 },
  detailLabel: { fontFamily: Fonts.family.semiBold, color: Colors.onSurface },
  sectionTitle: {
    fontFamily: Fonts.family.serifSemiBold,
    fontSize: Fonts.size.md,
    color: Colors.primary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: { fontFamily: Fonts.family.regular, fontSize: Fonts.size.sm, color: Colors.textMuted, paddingVertical: Spacing.md },
  offerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
  },
  offerStoreName: { fontFamily: Fonts.family.semiBold, fontSize: Fonts.size.sm, color: Colors.onSurface },
  offerAddress: { fontFamily: Fonts.family.regular, fontSize: Fonts.size.xs, color: Colors.textMuted, marginTop: 1 },
  offerStatus: { fontFamily: Fonts.family.regular, fontSize: 11, marginTop: 2 },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  deliveryText: { fontFamily: Fonts.family.regular, fontSize: 11, color: Colors.textMuted },
  offerPrice: { fontFamily: Fonts.family.semiBold, fontSize: Fonts.size.sm, color: Colors.primary },
  addBtn: {
    marginTop: Spacing.xs,
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  addBtnText: { fontFamily: Fonts.family.semiBold, fontSize: 11, color: Colors.onPrimary },
  footerNote: {
    fontFamily: Fonts.family.regular,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: Spacing.lg,
    textAlign: 'center',
    lineHeight: 15,
  },
});
