import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BlockchainRecord, RecallInfo, Alert } from '@/types';
import { Colors, Fonts, Type, Spacing, BorderRadius, Shadow } from '@/theme';
import Icon from './Icon';

// Blockchain Card Component
interface BlockchainCardProps {
  data: BlockchainRecord;
  onViewTechnical?: () => void;
}

export const BlockchainCard: React.FC<BlockchainCardProps> = ({ data, onViewTechnical }) => {
  const { t } = useTranslation();
  return (
    <View style={[styles.card, styles.blockchainCard, Shadow.sm]}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.iconBadgeGold}>
          <Icon name="cube" size={20} color={Colors.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{t('blockchain.title')} ✓</Text>
          <Text style={styles.cardSubTitle}>{data.network || t('blockchain.network')}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{t('blockchain.ref')}:</Text>
        <Text style={styles.monoText}>{data.transactionRef || 'N/A'}</Text>
      </View>

      {onViewTechnical && (
        <TouchableOpacity style={styles.textBtn} onPress={onViewTechnical}>
          <Text style={styles.textBtnLabel}>{t('blockchain.viewTechnical')} →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Recall Banner Component (Red Alert Banner)
interface RecallBannerProps {
  recall: RecallInfo;
  onPressDetails?: () => void;
}

export const RecallBanner: React.FC<RecallBannerProps> = ({ recall, onPressDetails }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.recallBanner}>
      <View style={styles.recallHeader}>
        <Icon name="warning" size={24} color={Colors.white} />
        <Text style={styles.recallTitle}>{t('recall.title')}</Text>
      </View>

      <Text style={styles.recallDesc} numberOfLines={3}>
        {recall.reason}
      </Text>

      <View style={styles.recallMetaRow}>
        <Text style={styles.recallMeta}>{t('recall.severity')}: {recall.severity}</Text>
        <Text style={styles.recallMeta}>{t('recall.recallDate')}: {recall.recallDate}</Text>
      </View>

      {onPressDetails && (
        <TouchableOpacity style={styles.recallBtn} onPress={onPressDetails}>
          <Text style={styles.recallBtnText}>{t('recall.viewFullDetails')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Offline Banner Component
export const OfflineBanner: React.FC = () => {
  const { t } = useTranslation();
  return (
    <View style={styles.offlineBanner}>
      <Icon name="cloud-offline-outline" size={18} color={Colors.warning} />
      <View style={{ flex: 1 }}>
        <Text style={styles.offlineTitle}>{t('common.offline')}</Text>
        <Text style={styles.offlineDesc}>{t('common.offlineDesc')}</Text>
      </View>
    </View>
  );
};

// Alert Card Component
interface AlertCardProps {
  alert: Alert;
  onPress: () => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, onPress }) => {
  const getIcon = () => {
    switch (alert.type) {
      case 'recall':
        return { name: 'warning' as const, color: Colors.error };
      case 'expiry':
        return { name: 'time' as const, color: Colors.warning };
      case 'verification':
        return { name: 'checkmark-circle' as const, color: Colors.success };
      case 'safety':
        return { name: 'shield-half' as const, color: Colors.warning };
      default:
        return { name: 'notifications' as const, color: Colors.primary };
    }
  };

  const iconInfo = getIcon();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        styles.alertCard,
        { borderLeftColor: iconInfo.color },
        !alert.read && styles.unreadCard,
        Shadow.sm,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.alertRow}>
        <View style={[styles.alertIconCircle, { backgroundColor: iconInfo.color + '1F' }]}>
          <Icon name={iconInfo.name} size={20} color={iconInfo.color} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.alertTitle, { color: iconInfo.color }]}>{alert.title}</Text>
          <Text style={styles.alertMessage}>{alert.message}</Text>
          <Text style={styles.alertDate}>{alert.date}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// SearchBar Component
interface SearchBarProps {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder,
  onClear,
}) => {
  const { t } = useTranslation();
  return (
    <View style={styles.searchContainer}>
      <Icon name="search-outline" size={20} color={Colors.textMuted} style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? t('searchScreen.placeholder')}
        placeholderTextColor={Colors.textMuted}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear || (() => onChangeText(''))}>
          <Icon name="close-circle" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
};

// FilterChips Component
// `key` is the stable internal filter value (compared against untranslated
// data like `product.status`); `label` is what's shown, and may be
// translated independently of `key`.
export interface FilterChipOption {
  key: string;
  label: string;
}

interface FilterChipsProps {
  options: FilterChipOption[];
  selected: string;
  onSelect: (key: string) => void;
}

export const FilterChips: React.FC<FilterChipsProps> = ({ options, selected, onSelect }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.chipsContainer}
      contentContainerStyle={styles.chipsContent}
    >
      {options.map((opt) => {
        const active = selected === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(opt.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

// EmptyState Component
interface EmptyStateProps {
  icon?: any;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Icon name="leaf-outline" size={36} color={Colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDesc}>{description}</Text>

      {actionText && onAction && (
        <TouchableOpacity style={styles.emptyActionBtn} onPress={onAction}>
          <Text style={styles.emptyActionText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Cream surface, 24px organic radius, no hard border — depth comes from
  // the ambient tonal shadow instead.
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  blockchainCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.onTertiaryContainer + '40',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconBadgeGold: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.onTertiaryContainer + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  cardTitle: {
    ...Type.headlineSm,
    color: Colors.primary,
  },
  cardSubTitle: {
    ...Type.bodySm,
    color: Colors.onSurfaceVariant,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  infoLabel: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
    marginRight: 6,
  },
  monoText: {
    fontFamily: Fonts.family.semiBold,
    fontWeight: Fonts.weight.semiBold,
    fontSize: Fonts.size.xs + 1,
    color: Colors.text,
  },
  textBtn: {
    marginTop: 8,
  },
  textBtnLabel: {
    fontFamily: Fonts.family.semiBold,
    fontWeight: Fonts.weight.semiBold,
    fontSize: Fonts.size.xs + 1,
    color: Colors.primary,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.lightGreen,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.base,
  },
  offlineTitle: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.sm,
    color: Colors.text,
  },
  offlineDesc: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs,
    color: Colors.textSecondary,
  },
  recallBanner: {
    backgroundColor: Colors.error,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.base,
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  recallHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  recallTitle: {
    fontFamily: Fonts.family.bold,
    fontWeight: Fonts.weight.bold,
    fontSize: Fonts.size.base,
    color: Colors.white,
    marginLeft: Spacing.xs + 2,
  },
  recallDesc: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs + 1,
    color: Colors.white,
    opacity: 0.95,
    lineHeight: 18,
    marginVertical: 4,
  },
  recallMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  recallMeta: {
    fontFamily: Fonts.family.medium,
    fontWeight: Fonts.weight.medium,
    fontSize: Fonts.size.xs,
    color: Colors.white,
    opacity: 0.85,
  },
  recallBtn: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.md,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: Spacing.sm + 2,
  },
  recallBtnText: {
    fontFamily: Fonts.family.bold,
    fontWeight: Fonts.weight.bold,
    fontSize: Fonts.size.xs + 1,
    color: Colors.error,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  // Coloured left rail encodes severity alongside the icon and title colour,
  // so status never rests on colour alone.
  alertCard: {
    borderLeftWidth: 5,
    paddingLeft: Spacing.base,
  },
  alertIconCircle: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  unreadCard: {
    backgroundColor: Colors.surfaceContainerLowest,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  alertTitle: {
    fontFamily: Fonts.family.semiBold,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: Spacing.xs,
  },
  alertDate: {
    ...Type.labelCaps,
    color: Colors.outline,
    marginTop: Spacing.sm,
  },
  alertMessage: {
    ...Type.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.base,
    height: 52,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  searchIcon: {
    marginRight: Spacing.md,
  },
  searchInput: {
    flex: 1,
    ...Type.bodyMd,
    color: Colors.onSurface,
  },
  chipsContainer: {
    flexGrow: 0,
    marginBottom: Spacing.base,
  },
  // Horizontal ScrollView content defaults to alignItems:'stretch' on its
  // cross axis, which would stretch each chip to the ScrollView's full
  // height — flex-start keeps them sized to their own text.
  chipsContent: {
    alignItems: 'flex-start',
    paddingRight: Spacing.gutter,
  },
  // Fully pill-shaped status/filter chips.
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  chipActive: {
    backgroundColor: Colors.primaryContainer,
  },
  chipText: {
    ...Type.labelMd,
    color: Colors.onSurfaceVariant,
  },
  chipTextActive: {
    color: Colors.onPrimary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Type.headlineLgMobile,
    color: Colors.primary,
    textAlign: 'center',
  },
  emptyDesc: {
    ...Type.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: Spacing.sm,
    maxWidth: 320,
  },
  emptyActionBtn: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xl,
  },
  emptyActionText: {
    ...Type.labelMd,
    fontSize: 16,
    color: Colors.onPrimary,
  },
});
