import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/theme';
import { AppHeader } from '@/components/Header';
import { ChatThread, useKeyboardScrollNudge } from '@/components/ChatThread';
import { useChatSession } from '@/hooks/useChatSession';
import { useAuthStore } from '@/store/authStore';
import { GuestGate } from '@/components/GuestGate';

export default function CopilotScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isGuest = useAuthStore((s) => s.isGuest);
  const canChat = isAuthenticated && !isGuest;

  const chat = useChatSession(canChat);
  useKeyboardScrollNudge(chat.scrollRef, [chat.messages, chat.sending]);

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showBack onBackPress={() => router.back()} title="Ask AyurTrace+" />

      <GuestGate message="Sign in to chat with AyurTrace+ and get answers personalized to your health profile.">
        <ChatThread
          {...chat}
          showConsultCta
          greeting="Hello! I can help you explore Ayurvedic products and their documented uses. I'll ask a few questions before showing relevant options."
          disclaimer="Explore verified Ayurvedic information. I ask a few questions before showing relevant options, and I never diagnose or replace professional medical advice."
        />
      </GuestGate>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
});
