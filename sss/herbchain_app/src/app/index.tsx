import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, BorderRadius } from '@/theme';
import Icon from '@/components/Icon';
import { useAuthStore } from '@/store/authStore';

export default function SplashScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasSeenOnboarding = useAuthStore((s) => s.hasSeenOnboarding);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [hydrationTimedOut, setHydrationTimedOut] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    const minTimer = setTimeout(() => setMinTimeElapsed(true), 2400);
    // Session hydration is an API call — don't let a slow/unreachable server
    // strand the user on the splash screen forever.
    const fallbackTimer = setTimeout(() => setHydrationTimedOut(true), 6000);

    return () => {
      clearTimeout(minTimer);
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Waits for both the minimum splash duration and session hydration (or its
  // timeout) so the redirect below always reads the up-to-date auth state,
  // not whatever it was at the moment this effect first ran.
  useEffect(() => {
    if (!minTimeElapsed || (!hasHydrated && !hydrationTimedOut)) return;

    if (isAuthenticated) {
      router.replace('/(tabs)');
    } else if (hasSeenOnboarding) {
      router.replace('/login');
    } else {
      router.replace('/onboarding');
    }
  }, [minTimeElapsed, hasHydrated, hydrationTimedOut, isAuthenticated, hasSeenOnboarding]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoBadge}>
          <Icon name="leaf" size={48} color={Colors.gold} />
        </View>

        <Text style={styles.brandTitle}>
          AYUTRACE<Text style={styles.goldPlus}>+</Text>
        </Text>

        <Text style={styles.tagline}>Trace • Verify • Trust</Text>

        <View style={styles.divider} />

        <Text style={styles.subtitle}>Authentic Ayurveda. Transparent Journey.</Text>

        <View style={styles.loadingRow}>
          <View style={styles.pulseDot} />
          <Text style={styles.verifyingText}>Verifying Blockchain Ledger...</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkGreen,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  content: {
    alignItems: 'center',
  },
  logoBadge: {
    width: 90,
    height: 90,
    borderRadius: BorderRadius['2xl'],
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.gold + '60',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  brandTitle: {
    fontFamily: Fonts.family.serifSemiBold,
    fontSize: Fonts.size['3xl'] + 4,
    color: Colors.white,
    letterSpacing: 1,
  },
  goldPlus: {
    color: Colors.gold,
  },
  tagline: {
    fontFamily: Fonts.family.medium,
    fontWeight: Fonts.weight.medium,
    fontSize: Fonts.size.sm + 1,
    color: Colors.gold,
    letterSpacing: 2,
    marginTop: Spacing.xs,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: Colors.gold + '40',
    marginVertical: Spacing.lg,
  },
  subtitle: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.sm,
    color: Colors.lightGreen,
    opacity: 0.9,
    textAlign: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing['2xl'],
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gold,
    marginRight: 8,
  },
  verifyingText: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
  },
});
