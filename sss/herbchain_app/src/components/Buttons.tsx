import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '@/theme';
import Icon, { IconName } from './Icon';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md' | 'lg';
}

export const PrimaryButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  size = 'md',
}) => {
  const getPaddingVertical = () => {
    switch (size) {
      case 'sm':
        return Spacing.xs + 2;
      case 'lg':
        return Spacing.md + 2;
      default:
        return Spacing.sm + 4;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return Fonts.size.sm;
      case 'lg':
        return Fonts.size.base;
      default:
        return Fonts.size.md;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.primaryBtn,
        { paddingVertical: getPaddingVertical() },
        disabled && styles.disabledBtn,
        Shadow.sm,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={Colors.white} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Icon name={icon} size={getFontSize() + 2} color={Colors.white} style={styles.leftIcon} />
          )}
          <Text style={[styles.primaryText, { fontSize: getFontSize() }, textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <Icon name={icon} size={getFontSize() + 2} color={Colors.white} style={styles.rightIcon} />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

export const SecondaryButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  size = 'md',
}) => {
  const getPaddingVertical = () => {
    switch (size) {
      case 'sm':
        return Spacing.xs + 2;
      case 'lg':
        return Spacing.md + 2;
      default:
        return Spacing.sm + 4;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return Fonts.size.sm;
      case 'lg':
        return Fonts.size.base;
      default:
        return Fonts.size.md;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.secondaryBtn,
        { paddingVertical: getPaddingVertical() },
        disabled && styles.disabledSecondaryBtn,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={Colors.primary} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Icon name={icon} size={getFontSize() + 2} color={Colors.primary} style={styles.leftIcon} />
          )}
          <Text style={[styles.secondaryText, { fontSize: getFontSize() }, textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <Icon name={icon} size={getFontSize() + 2} color={Colors.primary} style={styles.rightIcon} />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Primary: Deep Forest Green ground, cream label, softened 12px corners.
  primaryBtn: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryText: {
    color: Colors.onPrimary,
    fontFamily: Fonts.family.medium,
    textAlign: 'center',
  },
  // Secondary/Trace: ghost style with a Deep Forest hairline.
  secondaryBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primaryContainer,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  secondaryText: {
    color: Colors.primaryContainer,
    fontFamily: Fonts.family.medium,
    textAlign: 'center',
  },
  disabledBtn: {
    backgroundColor: Colors.outline,
    opacity: 0.5,
  },
  disabledSecondaryBtn: {
    borderColor: Colors.outlineVariant,
    opacity: 0.5,
  },
  leftIcon: {
    marginRight: Spacing.xs + 2,
  },
  rightIcon: {
    marginLeft: Spacing.xs + 2,
  },
});
