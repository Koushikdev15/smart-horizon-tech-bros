import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '@/theme';
import { AppHeader } from '@/components/Header';

export default function NotificationSettingsScreen() {
  const router = useRouter();

  const [settings, setSettings] = useState({
    recallAlerts: true,
    expiryReminders: true,
    verificationUpdates: true,
    labUpdates: true,
    safetyAlerts: true,
    securityAlerts: true,
  });

  const toggle = (key: keyof typeof settings) => {
    if (key === 'recallAlerts') {
      alert('Critical recall notifications must remain enabled for customer safety.');
      return;
    }
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showBack onBackPress={() => router.back()} title="Notification Preferences" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, Shadow.sm]}>
          <Text style={styles.sectionTitle}>Alert Categories</Text>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Recall Alerts (Critical)</Text>
              <Text style={styles.toggleSub}>Immediate warnings for batch recalls</Text>
            </View>
            <Switch value={settings.recallAlerts} onValueChange={() => toggle('recallAlerts')} trackColor={{ true: Colors.primary }} />
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Expiry Reminders</Text>
              <Text style={styles.toggleSub}>Notifications for saved product expiry</Text>
            </View>
            <Switch value={settings.expiryReminders} onValueChange={() => toggle('expiryReminders')} trackColor={{ true: Colors.primary }} />
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Verification Updates</Text>
              <Text style={styles.toggleSub}>Updates when trust scores are re-verified</Text>
            </View>
            <Switch value={settings.verificationUpdates} onValueChange={() => toggle('verificationUpdates')} trackColor={{ true: Colors.primary }} />
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Laboratory Updates</Text>
              <Text style={styles.toggleSub}>Notifications when lab reports are updated</Text>
            </View>
            <Switch value={settings.labUpdates} onValueChange={() => toggle('labUpdates')} trackColor={{ true: Colors.primary }} />
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Safety Alerts</Text>
              <Text style={styles.toggleSub}>General Ayurvedic safety advisories</Text>
            </View>
            <Switch value={settings.safetyAlerts} onValueChange={() => toggle('safetyAlerts')} trackColor={{ true: Colors.primary }} />
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Security Alerts</Text>
              <Text style={styles.toggleSub}>Account access and login alerts</Text>
            </View>
            <Switch value={settings.securityAlerts} onValueChange={() => toggle('securityAlerts')} trackColor={{ true: Colors.primary }} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  sectionTitle: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.base,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  toggleTitle: {
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.size.sm + 1,
    color: Colors.text,
  },
  toggleSub: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
