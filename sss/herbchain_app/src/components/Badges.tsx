import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Type, Spacing, BorderRadius } from '@/theme';
import Icon from './Icon';

interface TrustScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const TrustScore: React.FC<TrustScoreProps> = ({
  score,
  size = 'md',
  showLabel = false,
}) => {
  const getColor = () => {
    if (score >= 90) return Colors.trustExcellent;
    if (score >= 75) return Colors.trustGood;
    if (score >= 50) return Colors.trustFair;
    return Colors.trustPoor;
  };

  const getLabel = () => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return { circle: 40, fontSize: 16, denomSize: 9, labelSize: 10, border: 2 };
      case 'lg':
        return { circle: 148, fontSize: 52, denomSize: 14, labelSize: 14, border: 3 };
      default:
        return { circle: 64, fontSize: 24, denomSize: 11, labelSize: 12, border: 2.5 };
    }
  };

  const dims = getDimensions();
  const color = getColor();

  return (
    <View style={styles.trustContainer}>
      <View
        style={[
          styles.trustCircle,
          {
            width: dims.circle,
            height: dims.circle,
            borderRadius: dims.circle / 2,
            borderColor: color,
            borderWidth: dims.border,
          },
        ]}
      >
        <Text style={[styles.scoreText, { fontSize: dims.fontSize, color }]}>{score}</Text>
        <Text style={[styles.scoreDenom, { fontSize: dims.denomSize }]}>/100</Text>
      </View>
      {showLabel && (
        <Text style={[styles.trustLabel, { fontSize: dims.labelSize }]}>
          {getLabel()} Trust Score
        </Text>
      )}
    </View>
  );
};

interface StatusBadgeProps {
  status: 'verified' | 'recalled' | 'expired' | 'pending' | 'warning';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'verified':
        return { label: 'VERIFIED', bg: Colors.secondaryContainer, color: Colors.onSecondaryContainer, icon: 'checkmark-circle' as const };
      case 'recalled':
        return { label: 'RECALLED', bg: Colors.errorContainer, color: Colors.onErrorContainer, icon: 'alert-circle' as const };
      case 'expired':
        return { label: 'EXPIRED', bg: Colors.tertiaryFixed, color: Colors.onTertiaryFixedVariant, icon: 'time' as const };
      case 'warning':
        return { label: 'WARNING', bg: Colors.tertiaryFixed, color: Colors.onTertiaryFixedVariant, icon: 'warning' as const };
      default:
        return { label: 'PENDING', bg: Colors.surfaceContainerHigh, color: Colors.onSurfaceVariant, icon: 'hourglass' as const };
    }
  };

  const config = getBadgeConfig();
  const isSm = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: config.bg, paddingVertical: isSm ? 2 : 4, paddingHorizontal: isSm ? 6 : 10 }]}>
      <Icon name={config.icon} size={isSm ? 12 : 14} color={config.color} style={{ marginRight: 4 }} />
      <Text style={[styles.badgeText, { color: config.color, fontSize: isSm ? 10 : 12 }]}>
        {config.label}
      </Text>
    </View>
  );
};

interface VerificationBadgeProps {
  label: string;
  verified?: boolean;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({ label, verified = true }) => {
  return (
    <View style={styles.verifRow}>
      <Icon
        name={verified ? 'checkmark-circle' : 'close-circle'}
        size={16}
        color={verified ? Colors.success : Colors.error}
        style={{ marginRight: 6 }}
      />
      <Text style={[styles.verifLabel, !verified && { color: Colors.textMuted }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  trustContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
  },
  // Score reads in the serif to match the "trust statement" hierarchy.
  scoreText: {
    fontFamily: Fonts.family.serifSemiBold,
  },
  scoreDenom: {
    fontFamily: Fonts.family.regular,
    color: Colors.onSurfaceVariant,
    marginTop: -2,
  },
  trustLabel: {
    fontFamily: Fonts.family.medium,
    color: Colors.onSurfaceVariant,
    marginTop: Spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontFamily: Fonts.family.semiBold,
    letterSpacing: 0.6,
  },
  verifRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifLabel: {
    ...Type.labelMd,
    color: Colors.onSurface,
  },
});
