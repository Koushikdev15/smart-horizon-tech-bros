import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Fonts, Type, Spacing, BorderRadius, Shadow } from '@/theme';
import Icon from './Icon';

interface AppHeaderProps {
  greeting?: string;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  unreadCount?: number;
  showBack?: boolean;
  onBackPress?: () => void;
  title?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  greeting,
  onNotificationPress,
  onProfilePress,
  unreadCount = 0,
  showBack = false,
  onBackPress,
  title,
}) => {
  if (showBack) {
    return (
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBackPress} activeOpacity={0.7}>
          <Icon name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.titleText} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.iconPlaceholder} />
      </View>
    );
  }

  return (
    <View style={styles.headerRow}>
      {/* Leading avatar / profile */}
      <TouchableOpacity
        style={styles.avatarBtn}
        onPress={onProfilePress}
        activeOpacity={0.7}
        disabled={!onProfilePress}
      >
        <Icon name="person" size={20} color={Colors.primaryContainer} />
      </TouchableOpacity>

      {/* Centred serif wordmark */}
      <View style={styles.brandCenter}>
        <Text style={styles.brandName} numberOfLines={1}>
          AYUTRACE+
        </Text>
        {greeting ? (
          <Text style={styles.greetingText} numberOfLines={1}>
            {greeting}
          </Text>
        ) : null}
      </View>

      {/* Trailing bell */}
      {onNotificationPress ? (
        <TouchableOpacity style={styles.iconBtn} onPress={onNotificationPress} activeOpacity={0.7}>
          <Icon name="notifications-outline" size={22} color={Colors.primary} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.iconPlaceholder} />
      )}
    </View>
  );
};

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onActionPress?: () => void;
  style?: any;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionText,
  onActionPress,
  style,
}) => {
  return (
    <View style={[styles.sectionRow, style]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
      {actionText && onActionPress && (
        <TouchableOpacity onPress={onActionPress} activeOpacity={0.7}>
          <Text style={styles.actionText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.gutter,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  brandCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  brandName: {
    ...Type.headlineMd,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  greetingText: {
    ...Type.labelMd,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPlaceholder: {
    width: 40,
  },
  badge: {
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
  badgeText: {
    color: Colors.white,
    fontSize: 9,
    fontFamily: Fonts.family.bold,
  },
  titleText: {
    ...Type.headlineSm,
    color: Colors.primary,
    textAlign: 'center',
    flex: 1,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.gutter,
  },
  sectionTitle: {
    ...Type.headlineMd,
    color: Colors.primary,
  },
  sectionSubtitle: {
    ...Type.bodySm,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  actionText: {
    ...Type.labelMd,
    color: Colors.primary,
  },
});
