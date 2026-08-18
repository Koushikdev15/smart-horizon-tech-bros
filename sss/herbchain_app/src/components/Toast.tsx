import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '@/theme';
import Icon, { IconName } from './Icon';
import { useToastStore, type ToastType } from '@/store/toastStore';

const DISPLAY_MS = 2500;

const VARIANT: Record<ToastType, { bg: string; fg: string; icon: IconName }> = {
  success: { bg: Colors.primary, fg: Colors.white, icon: 'checkmark-circle' },
  error: { bg: Colors.error, fg: Colors.white, icon: 'alert-circle' },
  info: { bg: Colors.text, fg: Colors.white, icon: 'information-circle' },
};

/**
 * Global toast host — mounted once in the root layout. Any screen can call
 * useToastStore.getState().show('message') without needing this component in
 * its own tree, since it just reads the shared store.
 */
export const ToastHost: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { message, type, token, hide } = useToastStore();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-16)).current;

  useEffect(() => {
    if (!message) return;

    opacity.setValue(0);
    translateY.setValue(-16);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => hide());
    }, DISPLAY_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!message) return null;

  const variant = VARIANT[type];

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        { top: insets.top + Spacing.sm, opacity, transform: [{ translateY }] },
      ]}
    >
      <Animated.View style={[styles.toast, Shadow.md, { backgroundColor: variant.bg }]}>
        <Icon name={variant.icon} size={18} color={variant.fg} />
        <Text style={[styles.text, { color: variant.fg }]}>{message}</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    alignItems: 'center',
    zIndex: 999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    maxWidth: 480,
    width: '100%',
  },
  text: {
    flex: 1,
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.size.sm,
  },
});
