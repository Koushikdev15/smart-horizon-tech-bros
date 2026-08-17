import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Type, Spacing, BorderRadius, Shadow } from '@/theme';
import { AppHeader } from '@/components/Header';
import Icon from '@/components/Icon';
import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import SelectField from '@/components/forms/SelectField';
import { STATES } from '@/features/registration/constants';
import { GuestGate } from '@/components/GuestGate';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { ApiError } from '@/lib/api';
import { ebuyService, type PurchaseProduct, type StoreOffer, type Order } from '@/services/ebuyService';

function ProductPurchaseCard({ product, onPress }: { product: PurchaseProduct; onPress: () => void }) {
  const avail = product.regionAvailability;
  return (
    <TouchableOpacity style={[styles.productCard, Shadow.sm]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.productImgBox}>
        <Icon name="leaf-outline" size={28} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.productName}>{product.productName}</Text>
        {product.healthTopics.length > 0 && (
          <Text style={styles.productTopics}>{product.healthTopics.join(', ')}</Text>
        )}
        {avail ? (
          <View style={styles.availBadge}>
            <Icon name="checkmark-circle" size={12} color={Colors.onSecondaryContainer} />
            <Text style={styles.availBadgeText}>
              {avail.storeCount} store{avail.storeCount > 1 ? 's' : ''} in region
              {avail.minPrice != null ? ` · from ₹${avail.minPrice}` : ''}
            </Text>
          </View>
        ) : (
          <Text style={styles.unavailText}>Not stocked in selected region</Text>
        )}
      </View>
      <Icon name="chevron-forward" size={20} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

export default function EBuyScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isGuest = useAuthStore((s) => s.isGuest);
  const user = useAuthStore((s) => s.user);
  const { items: cartItems, addItem, updateQuantity, clear } = useCartStore();

  const [region, setRegion] = useState(user?.region || '');
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<PurchaseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [offersProduct, setOffersProduct] = useState<PurchaseProduct | null>(null);
  const [offers, setOffers] = useState<StoreOffer[] | null>(null);
  const [offersLoading, setOffersLoading] = useState(false);

  const [cartOpen, setCartOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  async function loadProducts() {
    setLoading(true);
    setLoadError(null);
    try {
      const results = await ebuyService.browse({ q: query || undefined, region: region || undefined });
      setProducts(results);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Could not load products.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, [region]);

  async function openOffers(product: PurchaseProduct) {
    setOffersProduct(product);
    setOffers(null);
    setOffersLoading(true);
    try {
      const results = await ebuyService.getOffers(product._id, region || undefined);
      setOffers(results);
    } catch {
      setOffers([]);
    } finally {
      setOffersLoading(false);
    }
  }

  function handleAddToCart(offer: StoreOffer) {
    if (!offersProduct || offer.price == null) return;
    addItem(
      {
        productId: offersProduct._id,
        productName: offersProduct.productName,
        storeId: offer.storeId,
        storeName: offer.storeName,
        unitPrice: offer.price,
      },
      1
    );
    setOffersProduct(null);
  }

  const cartTotal = cartItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  async function handlePlaceOrder() {
    if (!deliveryAddress.trim()) {
      setOrderError('Enter a delivery address.');
      return;
    }
    setPlacingOrder(true);
    setOrderError(null);
    try {
      const order = await ebuyService.placeOrder({
        items: cartItems.map((i) => ({ productId: i.productId, storeId: i.storeId, quantity: i.quantity })),
        deliveryAddress: deliveryAddress.trim(),
        region: region || user?.region || 'Unspecified',
        paymentMethod,
      });
      setPlacedOrder(order);
      clear();
    } catch (err) {
      setOrderError(err instanceof ApiError ? err.message : 'Could not place your order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>E-Buy</Text>
        <TouchableOpacity style={styles.cartBtn} onPress={() => setCartOpen(true)}>
          <Icon name="cart-outline" size={22} color={Colors.primary} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <GuestGate message="Sign in to browse and buy Ayurvedic products online.">
        <View style={styles.filtersRow}>
          <View style={{ flex: 1 }}>
            <SelectField label="" value={region} options={[...STATES]} onSelect={setRegion} placeholder="Sort by region" icon="location-outline" />
          </View>
        </View>
        <View style={styles.searchRow}>
          <Icon name="search-outline" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={loadProducts}
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : loadError ? (
            <View style={styles.centerBox}>
              <Text style={styles.errorText}>{loadError}</Text>
            </View>
          ) : products.length === 0 ? (
            <View style={styles.centerBox}>
              <Text style={styles.emptyText}>No products found.</Text>
            </View>
          ) : (
            products.map((p) => <ProductPurchaseCard key={p._id} product={p} onPress={() => openOffers(p)} />)
          )}
        </ScrollView>
      </GuestGate>

      {/* Product details + offers modal */}
      <Modal visible={Boolean(offersProduct)} transparent animationType="fade" onRequestClose={() => setOffersProduct(null)}>
        <Pressable style={styles.backdrop} onPress={() => setOffersProduct(null)}>
          <Pressable style={[styles.sheet, { maxHeight: '85%' }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.sheetTitle}>{offersProduct?.productName}</Text>

              {offersProduct?.healthTopics && offersProduct.healthTopics.length > 0 && (
                <View style={styles.topicsRow}>
                  {offersProduct.healthTopics.map((topic) => (
                    <View key={topic} style={styles.topicChip}>
                      <Text style={styles.topicChipText}>{topic}</Text>
                    </View>
                  ))}
                </View>
              )}

              {offersProduct?.description ? <Text style={styles.detailText}>{offersProduct.description}</Text> : null}

              {offersProduct?.ingredients && offersProduct.ingredients.length > 0 && (
                <Text style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ingredients: </Text>
                  {offersProduct.ingredients
                    .map((i) => (i.scientificName ? `${i.name} (${i.scientificName})` : i.name))
                    .join(', ')}
                </Text>
              )}
              {offersProduct?.usageInstructions ? (
                <Text style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Usage: </Text>
                  {offersProduct.usageInstructions}
                </Text>
              ) : null}
              {offersProduct?.precautions ? (
                <Text style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Precautions: </Text>
                  {offersProduct.precautions}
                </Text>
              ) : null}
              {offersProduct?.contraindications ? (
                <Text style={[styles.detailRow, { color: Colors.error }]}>
                  <Text style={styles.detailLabel}>Contraindications: </Text>
                  {offersProduct.contraindications}
                </Text>
              ) : null}

              <Text style={[styles.sheetTitle, { fontSize: 16, marginTop: Spacing.lg }]}>Available From</Text>
              {offersLoading ? (
                <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing.lg }} />
              ) : !offers || offers.length === 0 ? (
                <Text style={styles.emptyText}>No stores currently stock this product{region ? ` in ${region}` : ''}.</Text>
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
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Cart / checkout modal */}
      <Modal visible={cartOpen} transparent animationType="slide" onRequestClose={() => setCartOpen(false)}>
        <Pressable
          style={styles.backdrop}
          onPress={() => {
            setCartOpen(false);
            setPlacedOrder(null);
          }}
        >
          <Pressable style={[styles.sheet, { maxHeight: '85%' }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            {placedOrder ? (
              <View style={styles.confirmBox}>
                <Icon name="checkmark-circle" size={48} color={Colors.success} />
                <Text style={styles.sheetTitle}>Order Placed</Text>
                <Text style={styles.confirmText}>
                  Order #{placedOrder._id.slice(-8).toUpperCase()} · ₹{placedOrder.totalAmount} ·{' '}
                  {placedOrder.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
                </Text>
                <PrimaryButton
                  title="Done"
                  onPress={() => {
                    setCartOpen(false);
                    setPlacedOrder(null);
                  }}
                  style={{ marginTop: Spacing.lg, alignSelf: 'stretch' }}
                />
              </View>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled">
                <Text style={styles.sheetTitle}>Your Cart</Text>
                {cartItems.length === 0 ? (
                  <Text style={styles.emptyText}>Your cart is empty.</Text>
                ) : (
                  <>
                    {cartItems.map((item) => (
                      <View key={`${item.productId}-${item.storeId}`} style={styles.cartRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.offerStoreName}>{item.productName}</Text>
                          <Text style={styles.offerAddress}>{item.storeName}</Text>
                        </View>
                        <View style={styles.qtyRow}>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => updateQuantity(item.productId, item.storeId, item.quantity - 1)}
                          >
                            <Icon name="remove" size={16} color={Colors.primary} />
                          </TouchableOpacity>
                          <Text style={styles.qtyText}>{item.quantity}</Text>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => updateQuantity(item.productId, item.storeId, item.quantity + 1)}
                          >
                            <Icon name="add" size={16} color={Colors.primary} />
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.offerPrice}>₹{item.unitPrice * item.quantity}</Text>
                      </View>
                    ))}

                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Total</Text>
                      <Text style={styles.totalValue}>₹{cartTotal}</Text>
                    </View>

                    <Text style={styles.label}>Delivery Address</Text>
                    <TextInput
                      style={styles.addressInput}
                      value={deliveryAddress}
                      onChangeText={setDeliveryAddress}
                      placeholder="House / street, area, city, PIN"
                      placeholderTextColor={Colors.textMuted}
                      multiline
                    />

                    <Text style={styles.label}>Payment Method</Text>
                    <View style={styles.paymentRow}>
                      <TouchableOpacity
                        style={[styles.paymentOption, paymentMethod === 'COD' && styles.paymentOptionActive]}
                        onPress={() => setPaymentMethod('COD')}
                      >
                        <Icon name="cash-outline" size={18} color={paymentMethod === 'COD' ? Colors.onSecondaryContainer : Colors.textSecondary} />
                        <Text style={[styles.paymentOptionText, paymentMethod === 'COD' && styles.paymentOptionTextActive]}>
                          Cash on Delivery
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.paymentOption, styles.paymentOptionDisabled]}
                        onPress={() =>
                          Alert.alert('Coming soon', 'Online payment isn’t connected yet — please use Cash on Delivery for now.')
                        }
                      >
                        <Icon name="card-outline" size={18} color={Colors.outline} />
                        <Text style={styles.paymentOptionTextDisabled}>Online Payment (Coming soon)</Text>
                      </TouchableOpacity>
                    </View>

                    {orderError ? <Text style={styles.errorText}>{orderError}</Text> : null}

                    <PrimaryButton
                      title={placingOrder ? 'Placing Order…' : `Place Order · ₹${cartTotal}`}
                      onPress={handlePlaceOrder}
                      loading={placingOrder}
                      style={{ marginTop: Spacing.lg, marginBottom: Spacing.xl }}
                    />
                  </>
                )}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.gutter,
    paddingVertical: Spacing.md,
  },
  headerTitle: { ...Type.headlineMd, color: Colors.primary },
  cartBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: { color: Colors.white, fontSize: 9, fontFamily: Fonts.family.bold },
  filtersRow: { paddingHorizontal: Spacing.gutter },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.gutter,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  searchInput: { flex: 1, ...Type.bodyMd, color: Colors.text },
  scrollContent: { paddingHorizontal: Spacing.gutter, paddingBottom: Spacing['3xl'] },
  centerBox: { paddingVertical: Spacing['2xl'], alignItems: 'center' },
  errorText: { ...Type.bodySm, color: Colors.error, textAlign: 'center' },
  emptyText: { ...Type.bodySm, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.md },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  productImgBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: { ...Type.labelMd, fontSize: 15, color: Colors.onSurface },
  productTopics: { ...Type.bodySm, color: Colors.textSecondary, marginTop: 2 },
  availBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
  },
  availBadgeText: { ...Type.labelMd, fontSize: 10, color: Colors.onSecondaryContainer },
  unavailText: { ...Type.bodySm, fontSize: 11, color: Colors.textMuted, marginTop: Spacing.xs },
  backdrop: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    ...Shadow.lg,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
    marginBottom: Spacing.base,
  },
  sheetTitle: { ...Type.headlineSm, color: Colors.primary, marginBottom: Spacing.md },
  topicsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.sm },
  topicChip: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  topicChipText: { ...Type.labelMd, fontSize: 11, color: Colors.onSecondaryContainer },
  detailText: { ...Type.bodySm, color: Colors.textSecondary, marginBottom: Spacing.sm, lineHeight: 19 },
  detailRow: { ...Type.bodySm, color: Colors.textSecondary, marginBottom: Spacing.sm, lineHeight: 18 },
  detailLabel: { fontFamily: Fonts.family.semiBold, color: Colors.onSurface },
  offerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
  },
  offerStoreName: { ...Type.labelMd, color: Colors.onSurface },
  offerAddress: { ...Type.bodySm, color: Colors.textMuted, marginTop: 1 },
  offerStatus: { ...Type.bodySm, fontSize: 11, marginTop: 2 },
  offerPrice: { ...Type.labelMd, color: Colors.primary },
  addBtn: {
    marginTop: Spacing.xs,
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  addBtnText: { ...Type.labelMd, fontSize: 11, color: Colors.onPrimary },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
  },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { ...Type.labelMd, minWidth: 16, textAlign: 'center' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.outline,
  },
  totalLabel: { ...Type.headlineSm, color: Colors.onSurface },
  totalValue: { ...Type.headlineSm, color: Colors.primary },
  label: { ...Type.labelMd, color: Colors.onSurface, marginTop: Spacing.md, marginBottom: Spacing.sm },
  addressInput: {
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    minHeight: 60,
    textAlignVertical: 'top',
    ...Type.bodyMd,
    color: Colors.text,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  paymentRow: { gap: Spacing.sm },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  paymentOptionActive: { borderColor: Colors.secondary, backgroundColor: Colors.secondaryContainer },
  paymentOptionDisabled: { opacity: 0.6 },
  paymentOptionText: { ...Type.bodyMd, color: Colors.onSurface },
  paymentOptionTextActive: { color: Colors.onSecondaryContainer, fontFamily: Fonts.family.semiBold },
  paymentOptionTextDisabled: { ...Type.bodyMd, color: Colors.outline },
  confirmBox: { alignItems: 'center', paddingVertical: Spacing.lg },
  confirmText: { ...Type.bodySm, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },
});
