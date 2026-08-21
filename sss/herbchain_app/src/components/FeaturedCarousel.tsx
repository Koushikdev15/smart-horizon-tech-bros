import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '@/theme';
import Icon from './Icon';
import type { FeaturedProduct } from '@/hooks/useFeaturedProducts';

interface FeaturedCarouselProps {
  items: FeaturedProduct[];
  loading?: boolean;
  /** Login: false (display only). Home: true (opens Product Details). */
  clickable: boolean;
  onItemPress?: (item: FeaturedProduct) => void;
  /** Cancels the parent screen's own horizontal padding so slides bleed to
   *  the screen edges — pass the same value as that padding. */
  edgeToEdgeInset?: number;
  autoplayIntervalMs?: number;
}

const DEFAULT_INTERVAL_MS = 4000;

export const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({
  items,
  loading = false,
  clickable,
  onItemPress,
  edgeToEdgeInset = 0,
  autoplayIntervalMs = DEFAULT_INTERVAL_MS,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const slideWidth = screenWidth;

  const listRef = useRef<FlatList<FeaturedProduct>>(null);
  const indexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAutoplay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startAutoplay = useCallback(() => {
    stopAutoplay();
    if (items.length < 2) return;
    intervalRef.current = setInterval(() => {
      const next = (indexRef.current + 1) % items.length;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      indexRef.current = next;
      setActiveIndex(next);
    }, autoplayIntervalMs);
  }, [items.length, autoplayIntervalMs, stopAutoplay]);

  useEffect(() => {
    indexRef.current = 0;
    setActiveIndex(0);
    startAutoplay();
    return stopAutoplay;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, autoplayIntervalMs]);

  const handleMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
      const clamped = Math.max(0, Math.min(index, items.length - 1));
      indexRef.current = clamped;
      setActiveIndex(clamped);
      // Manual swipe: restart the wait so autoplay doesn't immediately
      // advance again right after the user just picked a slide.
      startAutoplay();
    },
    [slideWidth, items.length, startAutoplay]
  );

  if (loading) {
    return (
      <View style={[styles.wrap, { marginHorizontal: -edgeToEdgeInset }]}>
        <View style={[styles.card, { width: slideWidth - edgeToEdgeInset * 2, marginHorizontal: edgeToEdgeInset }]} />
      </View>
    );
  }

  // Empty/errored — the section simply doesn't render (per spec: no crash,
  // no visible error, page stays otherwise normal).
  if (!items.length) return null;

  return (
    <View style={[styles.wrap, { marginHorizontal: -edgeToEdgeInset }]}>
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={stopAutoplay}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        getItemLayout={(_, index) => ({ length: slideWidth, offset: slideWidth * index, index })}
        renderItem={({ item }) => (
          <CarouselSlide
            item={item}
            width={slideWidth}
            inset={edgeToEdgeInset}
            clickable={clickable}
            onPress={onItemPress}
          />
        )}
      />

      {items.length > 1 && (
        <View style={styles.pagination}>
          {items.map((item, i) => (
            <View key={item.id} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
};

const CarouselSlide: React.FC<{
  item: FeaturedProduct;
  width: number;
  inset: number;
  clickable: boolean;
  onPress?: (item: FeaturedProduct) => void;
}> = ({ item, width, inset, clickable, onPress }) => {
  const [imageFailed, setImageFailed] = useState(false);

  const accessibilityLabel = clickable
    ? `${item.title}. Tap to view product details.`
    : `${item.title}. Ayurvedic product educational information.`;

  const content = (
    <View style={[styles.card, { width: width - inset * 2 }]}>
      {imageFailed ? (
        <View style={styles.mediaFallback}>
          <Icon name="leaf-outline" size={40} color={Colors.onPrimaryContainer} />
        </View>
      ) : (
        <Image
          source={{ uri: item.imageUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
          onError={() => setImageFailed(true)}
        />
      )}

      <View style={styles.topBadge}>
        <Icon name="leaf" size={12} color={Colors.onPrimary} />
        <Text style={styles.topBadgeText}>FEATURED</Text>
      </View>

      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.75)']}
        style={styles.scrim}
        pointerEvents="none"
      />

      <View style={styles.bottomRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        </View>
        {clickable && (
          <View style={styles.exploreBadge}>
            <Text style={styles.exploreBadgeText}>Explore</Text>
            <Icon name="arrow-forward" size={13} color={Colors.white} />
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={{ width, paddingHorizontal: inset }}>
      {clickable ? (
        <TouchableOpacity activeOpacity={0.9} onPress={() => onPress?.(item)} accessibilityLabel={accessibilityLabel}>
          {content}
        </TouchableOpacity>
      ) : (
        <View accessibilityLabel={accessibilityLabel}>{content}</View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.sm },
  card: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    aspectRatio: 1.6,
    ...Shadow.md,
  },
  mediaFallback: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryContainer + '20',
  },
  topBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  topBadgeText: {
    fontFamily: Fonts.family.bold,
    fontSize: 10,
    letterSpacing: 0.5,
    color: Colors.onPrimary,
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
  },
  bottomRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  title: {
    fontFamily: Fonts.family.serifSemiBold,
    fontSize: Fonts.size.md,
    color: Colors.white,
  },
  exploreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  exploreBadgeText: {
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.size.xs + 1,
    color: Colors.white,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.outlineVariant,
  },
  dotActive: {
    width: 18,
    backgroundColor: Colors.primary,
  },
});
