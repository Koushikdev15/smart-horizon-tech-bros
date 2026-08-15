import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Type, Spacing, BorderRadius, Shadow } from '@/theme';
import Icon from './Icon';
import { PrimaryButton } from './Buttons';
import { useAuthStore } from '@/store/authStore';

interface GuestGateProps {
  message?: string;
  children: React.ReactNode;
}

/**
 * Guest Mode predates every backend-authenticated feature added since — it
 * sets isAuthenticated locally without ever issuing a real JWT, so any guest
 * hitting a real API gets a raw 401 instead of a helpful prompt. Wrap the
 * body of any screen that needs a real account with this instead.
 */
export const GuestGate: React.FC<GuestGateProps> = ({ message, children }) => {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isGuest = useAuthStore((s) => s.isGuest);

  if (!isAuthenticated || isGuest) {
    return (
      <View style={[styles.box, Shadow.sm]}>
        <View style={styles.iconBadge}>
          <Icon name="lock-closed-outline" size={24} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Sign in required</Text>
        <Text style={styles.desc}>
          {message || 'This needs an account so we can check it safely against your own health profile.'}
        </Text>
        <PrimaryButton title="Sign In" onPress={() => router.push('/login')} style={{ marginTop: Spacing.md }} />
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  box: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.xl,
    alignItems: 'center',
    margin: Spacing.base,
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Type.headlineSm,
    color: Colors.primary,
  },
  desc: {
    ...Type.bodySm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
