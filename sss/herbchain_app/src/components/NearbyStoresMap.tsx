import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import * as Location from 'expo-location';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '@/theme';
import { SectionHeader } from './Header';
import Icon from './Icon';
import { storeService, type NearbyStore } from '@/services/storeService';

type LoadState = 'idle' | 'requesting' | 'loading' | 'ready' | 'denied' | 'error';

const NEARBY_STORES_LIMIT = 10;

function openDirections(store: NearbyStore) {
  const { latitude, longitude } = store.coordinates;
  Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`);
}

function StoreRow({ store }: { store: NearbyStore }) {
  return (
    <TouchableOpacity style={styles.storeRow} onPress={() => openDirections(store)} activeOpacity={0.7}>
      <View style={styles.storeIconBox}>
        <Icon name="storefront-outline" size={18} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.storeName} numberOfLines={1}>{store.name}</Text>
        <Text style={styles.storeAddress} numberOfLines={1}>{store.address}</Text>
        <View style={styles.storeMetaRow}>
          <Text style={styles.storeDistance}>{store.distanceKm} km away</Text>
          {store.isOpenNow !== null && (
            <Text style={[styles.storeStatus, { color: store.isOpenNow ? Colors.secondary : Colors.error }]}>
              {store.isOpenNow ? 'Open now' : 'Closed'}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.stockBadge}>
        <Text style={styles.stockBadgeText}>
          {store.stockCount > 0 ? `${store.stockCount} in stock` : 'No stock data'}
        </Text>
      </View>
      <Icon name="chevron-forward" size={16} color={Colors.textMuted} style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
}

export const NearbyStoresMap: React.FC = () => {
  const [state, setState] = useState<LoadState>('idle');
  const [stores, setStores] = useState<NearbyStore[]>([]);

  async function load() {
    setState('requesting');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState('denied');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setState('loading');
      const results = await storeService.findNearby({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        maxDistanceKm: 25,
      });
      // findNearby already returns results sorted by distance ascending
      // (MongoDB $geoNear) — keep only the closest 10 for the home page.
      setStores(results.slice(0, NEARBY_STORES_LIMIT));
      setState('ready');
    } catch {
      setState('error');
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <View style={styles.wrap}>
      <SectionHeader title="Nearby Stores" />

      {(state === 'idle' || state === 'requesting' || state === 'loading') && (
        <View style={[styles.card, styles.centerBox, Shadow.sm]}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.statusText}>Finding stores near you…</Text>
        </View>
      )}

      {state === 'denied' && (
        <View style={[styles.card, styles.centerBox, Shadow.sm]}>
          <Icon name="location-outline" size={28} color={Colors.textMuted} />
          <Text style={styles.statusText}>Location permission is needed to show nearby stores.</Text>
          <TouchableOpacity onPress={load} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Allow Location</Text>
          </TouchableOpacity>
        </View>
      )}

      {state === 'error' && (
        <View style={[styles.card, styles.centerBox, Shadow.sm]}>
          <Icon name="alert-circle-outline" size={28} color={Colors.textMuted} />
          <Text style={styles.statusText}>Could not load nearby stores.</Text>
          <TouchableOpacity onPress={load} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {state === 'ready' && (
        <View style={[styles.card, Shadow.sm]}>
          {stores.length === 0 ? (
            <Text style={styles.emptyText}>No AyurTrace+ stores found within 25 km.</Text>
          ) : (
            stores.map((s, i) => (
              <React.Fragment key={s._id}>
                <StoreRow store={s} />
                {i < stores.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.base },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  centerBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xl, paddingHorizontal: Spacing.lg },
  statusText: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  retryBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  retryBtnText: { fontFamily: Fonts.family.semiBold, fontSize: Fonts.size.xs + 1, color: Colors.onPrimary },
  emptyText: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  storeIconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeName: { fontFamily: Fonts.family.semiBold, fontSize: Fonts.size.sm, color: Colors.onSurface },
  storeAddress: { fontFamily: Fonts.family.regular, fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  storeMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  storeDistance: { fontFamily: Fonts.family.regular, fontSize: 11, color: Colors.textSecondary },
  storeStatus: { fontFamily: Fonts.family.semiBold, fontSize: 11 },
  stockBadge: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  stockBadgeText: { fontFamily: Fonts.family.semiBold, fontSize: 10, color: Colors.onSecondaryContainer },
  divider: { height: 1, backgroundColor: Colors.outlineVariant, marginLeft: Spacing.md + 36 + Spacing.sm },
});
