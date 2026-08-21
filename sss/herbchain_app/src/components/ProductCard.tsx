import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Product } from '@/types';
import { Colors, Fonts, Type, Spacing, BorderRadius, Shadow } from '@/theme';
import { StatusBadge } from './Badges';
import Icon from './Icon';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onBookmarkPress?: () => void;
  isBookmarked?: boolean;
  variant?: 'full' | 'compact';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onBookmarkPress,
  isBookmarked = false,
  variant = 'full',
}) => {
  const { t } = useTranslation();
  const isCompact = variant === 'compact';

  return (
    <TouchableOpacity
      style={[styles.card, isCompact && styles.cardCompact, Shadow.md]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Botanical media panel with a floating verification seal */}
      <View style={[styles.media, isCompact && styles.mediaCompact]}>
        <Icon name="leaf" size={isCompact ? 28 : 36} color={Colors.onPrimaryContainer} />
        <View style={styles.sealWrap}>
          <StatusBadge status={product.status} size="sm" />
        </View>
        {onBookmarkPress && (
          <TouchableOpacity style={styles.bookmarkBtn} onPress={onBookmarkPress} activeOpacity={0.7}>
            <Icon
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={isBookmarked ? Colors.onTertiaryContainer : Colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.batchText} numberOfLines={1}>
          {t('product.batchLabel')}: {product.batchId}
        </Text>
        <Text style={styles.nameText} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.mfrText} numberOfLines={1}>
          {product.manufacturer}
        </Text>

        <View style={styles.footerRow}>
          <View style={styles.trustRow}>
            <Icon name="shield-checkmark-outline" size={16} color={Colors.secondary} />
            <Text style={styles.trustText}>{t('product.trustScoreLabel')}: {product.trustScore}/100</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // 24px radius + ambient shadow, per the "organic curves" shape language.
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    marginBottom: Spacing.base,
    overflow: 'hidden',
  },
  cardCompact: {
    width: 280,
    marginRight: Spacing.base,
    marginBottom: 0,
  },
  media: {
    height: 160,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaCompact: {
    height: 140,
  },
  sealWrap: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
  },
  bookmarkBtn: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: Spacing.base,
  },
  batchText: {
    ...Type.labelCaps,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.xs,
  },
  // Product names carry the serif — they are the "trust statement".
  nameText: {
    ...Type.headlineSm,
    color: Colors.primary,
  },
  mfrText: {
    ...Type.bodySm,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  trustText: {
    fontFamily: Fonts.family.medium,
    fontSize: 14,
    color: Colors.secondary,
  },
});
