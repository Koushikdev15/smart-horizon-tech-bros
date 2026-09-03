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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Type, Spacing, BorderRadius, Shadow } from '@/theme';
import Icon from '@/components/Icon';
import { PrimaryButton } from '@/components/Buttons';
import { GuestGate } from '@/components/GuestGate';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useToastStore } from '@/store/toastStore';
import { ApiError } from '@/lib/api';
import { ebuyService, type PurchaseProduct, type Order } from '@/services/ebuyService';
import { reviewService, type ProductReviewStats } from '@/services/reviewService';
import { estimateDelivery } from '@/lib/deliveryEstimate';
import type { IconName } from '@/components/Icon';

// Matches the health topics actually present in the product catalog
// (verified against the live data, not guessed) — filtering by a category
// with zero real matches would just be a broken, empty screen.
const HEALTH_CATEGORIES: { label: string; icon: IconName }[] = [
  { label: 'Immunity', icon: 'shield-checkmark-outline' },
  { label: 'Digestion', icon: 'nutrition-outline' },
  { label: 'Skin Health', icon: 'sparkles-outline' },
  { label: 'Hair & Skin', icon: 'cut-outline' },
  { label: 'Joint & Muscle Health', icon: 'body-outline' },
  { label: 'Respiratory Health', icon: 'medkit-outline' },
  { label: 'Stress', icon: 'leaf-outline' },
  { label: 'Sleep', icon: 'moon-outline' },
  { label: 'Energy', icon: 'flash-outline' },
  { label: 'Focus', icon: 'eye-outline' },
  { label: 'Memory', icon: 'bulb-outline' },
  { label: "Women's Health", icon: 'female-outline' },
  { label: 'Heart Health', icon: 'heart-outline' },
  { label: 'Detox', icon: 'water-outline' },
  { label: 'Pain & Inflammation', icon: 'bandage-outline' },
];

function ProductPurchaseCard({
  product,
  onPress,
  onAddToCart,
  adding,
  reviewStats,
}: {
  product: PurchaseProduct;
  onPress: () => void;
  onAddToCart: () => void;
  adding: boolean;
  reviewStats?: ProductReviewStats;
}) {
  const avail = product.regionAvailability;
  return (
    <TouchableOpacity style={[styles.productCard, Shadow.sm]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.productImgBox}>
        <Icon name="leaf-outline" size={22} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.productName} numberOfLines={1}>{product.productName}</Text>
        {avail?.minPrice != null ? (
          <Text style={styles.productPrice}>From ₹{avail.minPrice}</Text>
        ) : avail ? (
          <Text style={styles.productPrice}>{avail.storeCount} store{avail.storeCount > 1 ? 's' : ''} carry this</Text>
        ) : (
          <Text style={styles.unavailText}>Currently out of stock</Text>
        )}
        {reviewStats && reviewStats.reviewCount > 0 && (
          <View style={styles.ratingChipRow}>
            <Icon name="star" size={12} color={Colors.gold} />
            <Text style={styles.ratingChipText}>
              {reviewStats.avgRating.toFixed(1)} ({reviewStats.reviewCount})
            </Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={[styles.rowAddBtn, !avail && styles.rowAddBtnDisabled]}
        onPress={(e) => {
          e.stopPropagation();
          onAddToCart();
        }}
        disabled={!avail || adding}
      >
        {adding ? (
          <ActivityIndicator size="small" color={Colors.onPrimary} />
        ) : (
          <Text style={styles.rowAddBtnText}>Add to Cart</Text>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function EBuyScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isGuest = useAuthStore((s) => s.isGuest);
  const user = useAuthStore((s) => s.user);
  const { items: cartItems, addItem, updateQuantity, toggleSelected, removeSelected } = useCartStore();

  const [view, setView] = useState<'browse' | 'orders'>('browse');

  const [query, setQuery] = useState('');
  const [healthTopic, setHealthTopic] = useState<string | null>(null);
  const [products, setProducts] = useState<PurchaseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [reviewStatsMap, setReviewStatsMap] = useState<Record<string, ProductReviewStats>>({});

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  async function loadOrders() {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const results = await ebuyService.getMyOrders();
      setOrders(results);
    } catch {
      setOrdersError('Could not load your orders.');
    } finally {
      setOrdersLoading(false);
    }
  }

  useEffect(() => {
    if (view === 'orders') loadOrders();
  }, [view]);

  const [cartOpen, setCartOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  async function loadProducts() {
    setLoading(true);
    setLoadError(null);
    try {
      const results = await ebuyService.browse({ q: query || undefined, healthTopic: healthTopic || undefined });
      setProducts(results);
      reviewService
        .getStatsForMany(results.map((p) => p._id))
        .then(setReviewStatsMap)
        .catch(() => setReviewStatsMap({}));
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Could not load products.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [healthTopic]);

  function openProductDetail(product: PurchaseProduct) {
    router.push(`/ebuy/${product._id}` as any);
  }

  async function handleRowAddToCart(product: PurchaseProduct) {
    setAddingProductId(product._id);
    try {
      const offers = await ebuyService.getOffers(product._id);
      const inStock = offers.filter((o) => o.price != null);
      if (inStock.length === 1) {
        const offer = inStock[0];
        addItem(
          {
            productId: product._id,
            productName: product.productName,
            storeId: offer.storeId,
            storeName: offer.storeName,
            storeRegion: offer.region,
            unitPrice: offer.price!,
          },
          1
        );
        useToastStore.getState().show(`Added ${product.productName} to cart`, 'success');
      } else {
        openProductDetail(product);
      }
    } catch {
      openProductDetail(product);
    } finally {
      setAddingProductId(null);
    }
  }

  const selectedCartItems = cartItems.filter((i) => i.selected);
  const cartTotal = selectedCartItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  async function handlePlaceOrder() {
    if (selectedCartItems.length === 0) {
      setOrderError('Select at least one item to check out.');
      return;
    }
    if (!deliveryAddress.trim()) {
      setOrderError('Enter a delivery address.');
      return;
    }
    setPlacingOrder(true);
    setOrderError(null);
    try {
      // Online payment (Razorpay) is built but not currently offered in the
      // UI — see herbchain_app/src/app/ebuy/checkout.tsx and
      // herbchain_backend/src/services/RazorpayService.ts if it's re-enabled
      // later. Cash on Delivery is the only path customers can select today.
      const order = await ebuyService.placeOrder({
        items: selectedCartItems.map((i) => ({ productId: i.productId, storeId: i.storeId, quantity: i.quantity })),
        deliveryAddress: deliveryAddress.trim(),
        region: user?.region || 'Unspecified',
        paymentMethod: 'COD',
      });
      setPlacedOrder(order);
      removeSelected();
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
        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[styles.segment, view === 'browse' && styles.segmentActive]}
            onPress={() => setView('browse')}
          >
            <Text style={[styles.segmentText, view === 'browse' && styles.segmentTextActive]}>Browse</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segment, view === 'orders' && styles.segmentActive]}
            onPress={() => setView('orders')}
          >
            <Text style={[styles.segmentText, view === 'orders' && styles.segmentTextActive]}>Orders</Text>
          </TouchableOpacity>
        </View>

        {view === 'browse' ? (
          <>
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

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
              style={{ flexGrow: 0 }}
            >
              <TouchableOpacity style={styles.categoryItem} onPress={() => setHealthTopic(null)}>
                <View style={[styles.categoryIcon, !healthTopic && styles.categoryIconActive]}>
                  <Icon name="grid-outline" size={22} color={!healthTopic ? Colors.onPrimary : Colors.primary} />
                </View>
                <Text style={[styles.categoryLabel, !healthTopic && styles.categoryLabelActive]} numberOfLines={2}>All</Text>
              </TouchableOpacity>
              {HEALTH_CATEGORIES.map((cat) => {
                const active = healthTopic === cat.label;
                return (
                  <TouchableOpacity key={cat.label} style={styles.categoryItem} onPress={() => setHealthTopic(active ? null : cat.label)}>
                    <View style={[styles.categoryIcon, active && styles.categoryIconActive]}>
                      <Icon name={cat.icon} size={22} color={active ? Colors.onPrimary : Colors.primary} />
                    </View>
                    <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]} numberOfLines={2}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

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
                products.map((p) => (
                  <ProductPurchaseCard
                    key={p._id}
                    product={p}
                    onPress={() => openProductDetail(p)}
                    onAddToCart={() => handleRowAddToCart(p)}
                    adding={addingProductId === p._id}
                    reviewStats={reviewStatsMap[p._id]}
                  />
                ))
              )}
            </ScrollView>
          </>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {ordersLoading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator color={Colors.primary} />
              </View>
            ) : ordersError ? (
              <View style={styles.centerBox}>
                <Text style={styles.errorText}>{ordersError}</Text>
              </View>
            ) : orders.length === 0 ? (
              <View style={styles.centerBox}>
                <Text style={styles.emptyText}>You haven't placed any orders yet.</Text>
              </View>
            ) : (
              orders.map((order) => (
                <View key={order.id} style={[styles.orderCard, Shadow.sm]}>
                  <View style={styles.orderCardHeader}>
                    <Text style={styles.orderId}>Order #{order.id.slice(-8).toUpperCase()}</Text>
                    <View style={styles.orderStatusBadge}>
                      <Text style={styles.orderStatusText}>{order.orderStatus}</Text>
                    </View>
                  </View>
                  {order.items.map((item, i) => (
                    <Text key={i} style={styles.orderItemLine}>
                      {item.quantity}× {item.productName} · {item.storeName} · ₹{item.unitPrice * item.quantity}
                    </Text>
                  ))}
                  <View style={styles.orderFooterRow}>
                    <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                    <Text style={styles.orderTotal}>₹{order.totalAmount}</Text>
                  </View>
                  <Text style={styles.orderAddress} numberOfLines={1}>{order.deliveryAddress}</Text>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </GuestGate>

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
                  Order #{placedOrder.id.slice(-8).toUpperCase()} · ₹{placedOrder.totalAmount} ·{' '}
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
                        <TouchableOpacity
                          onPress={() => toggleSelected(item.productId, item.storeId)}
                          accessibilityLabel={item.selected ? 'Deselect item' : 'Select item for checkout'}
                        >
                          <Icon
                            name={item.selected ? 'checkbox' : 'checkbox-outline'}
                            size={22}
                            color={item.selected ? Colors.primary : Colors.textMuted}
                          />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.offerStoreName}>{item.productName}</Text>
                          <Text style={styles.offerAddress}>{item.storeName}</Text>
                          <Text style={styles.deliveryEstText}>{estimateDelivery(item.storeRegion, deliveryAddress)}</Text>
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
                      <Text style={styles.totalLabel}>
                        Total ({selectedCartItems.length} selected{selectedCartItems.length !== cartItems.length ? ` of ${cartItems.length}` : ''})
                      </Text>
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

                    <View style={styles.paymentRow}>
                      <View style={[styles.paymentOption, styles.paymentOptionActive]}>
                        <Icon name="cash-outline" size={18} color={Colors.onSecondaryContainer} />
                        <Text style={[styles.paymentOptionText, styles.paymentOptionTextActive]}>Cash on Delivery</Text>
                      </View>
                    </View>

                    {orderError ? <Text style={styles.errorText}>{orderError}</Text> : null}

                    <PrimaryButton
                      title={placingOrder ? 'Placing Order…' : `Place Order · ₹${cartTotal}`}
                      onPress={handlePlaceOrder}
                      loading={placingOrder}
                      disabled={selectedCartItems.length === 0}
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
  segmentRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginHorizontal: Spacing.gutter,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.full,
    padding: 4,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  segmentActive: { backgroundColor: Colors.primary },
  segmentText: { ...Type.labelMd, fontSize: 13, color: Colors.onSurfaceVariant },
  segmentTextActive: { color: Colors.onPrimary },
  orderCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  orderId: { ...Type.labelMd, color: Colors.onSurface },
  orderStatusBadge: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  orderStatusText: { fontFamily: Fonts.family.semiBold, fontSize: 10, color: Colors.onSecondaryContainer },
  orderItemLine: { ...Type.bodySm, color: Colors.onSurfaceVariant, marginTop: 2 },
  orderFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
  },
  orderDate: { ...Type.bodySm, color: Colors.textMuted },
  orderTotal: { ...Type.labelMd, color: Colors.primary },
  orderAddress: { ...Type.bodySm, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
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
  categoryRow: { paddingHorizontal: Spacing.gutter, paddingBottom: Spacing.md, gap: Spacing.md, alignItems: 'flex-start' },
  categoryItem: { alignItems: 'center', width: 76 },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryIconActive: { backgroundColor: Colors.primary },
  categoryLabel: {
    fontFamily: Fonts.family.medium,
    fontSize: 11,
    lineHeight: 13,
    height: 26,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  categoryLabelActive: { color: Colors.primary, fontFamily: Fonts.family.semiBold },
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
  productPrice: { ...Type.bodySm, color: Colors.primary, fontFamily: Fonts.family.semiBold, marginTop: 2 },
  unavailText: { ...Type.bodySm, fontSize: 11, color: Colors.textMuted, marginTop: Spacing.xs },
  ratingChipRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  ratingChipText: { fontFamily: Fonts.family.medium, fontSize: 11, color: Colors.textSecondary },
  rowAddBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  rowAddBtnDisabled: { backgroundColor: Colors.outlineVariant },
  rowAddBtnText: { ...Type.labelMd, fontSize: 11, color: Colors.onPrimary },
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
  offerStoreName: { ...Type.labelMd, color: Colors.onSurface },
  offerAddress: { ...Type.bodySm, color: Colors.textMuted, marginTop: 1 },
  deliveryEstText: { ...Type.bodySm, fontSize: 11, color: Colors.secondary, marginTop: 1 },
  offerPrice: { ...Type.labelMd, color: Colors.primary },
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
  paymentOptionText: { ...Type.bodyMd, color: Colors.onSurface },
  paymentOptionTextActive: { color: Colors.onSecondaryContainer, fontFamily: Fonts.family.semiBold },
  confirmBox: { alignItems: 'center', paddingVertical: Spacing.lg },
  confirmText: { ...Type.bodySm, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },
});
