import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import {
  EBGaramond_500Medium,
  EBGaramond_600SemiBold,
  EBGaramond_700Bold,
} from '@expo-google-fonts/eb-garamond';
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from '@expo-google-fonts/hanken-grotesk';
import { Colors } from '@/theme';
import { useProductStore } from '@/store/productStore';
import { useAuthStore } from '@/store/authStore';
import { ToastHost } from '@/components/Toast';
import '@/i18n';
import { loadPersistedLanguage } from '@/i18n';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* no-op: splash may already be hidden on fast refresh */
});

export default function RootLayout() {
  const loadDemoData = useProductStore((s) => s.loadDemoData);
  const hydrateAuth = useAuthStore((s) => s.hydrate);

  const [fontsLoaded, fontError] = useFonts({
    EBGaramond_500Medium,
    EBGaramond_600SemiBold,
    EBGaramond_700Bold,
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
  });

  useEffect(() => {
    loadDemoData();
    hydrateAuth();
    loadPersistedLanguage();
  }, []);

  // Hold the splash until the typefaces resolve so text never flashes in a
  // fallback face. A font error still releases it — shipping system-font text
  // beats hanging on the splash forever.
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.cream },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
        <Stack.Screen name="register" options={{ animation: 'fade' }} />
        <Stack.Screen name="registration-complete" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="verify/[batchId]" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="verify/manual" options={{ presentation: 'modal' }} />
        <Stack.Screen name="product/[id]" />
        <Stack.Screen name="doctor-consult/[doctorId]" />
        <Stack.Screen name="ebuy/[productId]" />
        <Stack.Screen name="ebuy/checkout" options={{ presentation: 'modal', gestureEnabled: false }} />
        {/* Not presented as a native modal — on Android, modal-presented
            screens don't reliably get windowSoftInputMode's resize behavior,
            so the keyboard covers the chat input instead of pushing it up. */}
        <Stack.Screen name="copilot" />
        <Stack.Screen name="search" />
        <Stack.Screen name="compare" />
        <Stack.Screen name="forum/index" />
        <Stack.Screen name="forum/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="forum/[postId]" />
        <Stack.Screen name="blog/[id]" />
        <Stack.Screen name="saved" />
        <Stack.Screen name="report" options={{ presentation: 'modal' }} />
        <Stack.Screen name="qr-not-found" options={{ presentation: 'modal' }} />
      </Stack>
      <ToastHost />
    </SafeAreaProvider>
  );
}
