import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '@/theme';
import { AppHeader } from '@/components/Header';
import Icon from '@/components/Icon';

export default function PrivacySettingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showBack onBackPress={() => router.back()} title="Privacy & Security" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, Shadow.sm]}>
          <View style={styles.iconHeader}>
            <Icon name="shield-checkmark" size={32} color={Colors.primary} />
            <Text style={styles.cardTitle}>Data Protection & Security Rules</Text>
          </View>

          <View style={styles.ruleItem}>
            <Text style={styles.ruleTitle}>🔒 Encrypted Credentials</Text>
            <Text style={styles.ruleDesc}>Passwords and tokens are stored in secure hardware-level storage. Passwords are never stored locally.</Text>
          </View>

          <View style={styles.ruleItem}>
            <Text style={styles.ruleTitle}>🌱 Protected Farmer Privacy</Text>
            <Text style={styles.ruleDesc}>Farm location data is displayed strictly at district/region level to protect farmer privacy and prevent illegal harvesting.</Text>
          </View>

          <View style={styles.ruleItem}>
            <Text style={styles.ruleTitle}>⛓️ Read-Only Ledger Verification</Text>
            <Text style={styles.ruleDesc}>Customer accounts only access public verification records on the blockchain. Private cryptographic keys and internal operational logs remain strictly isolated.</Text>
          </View>

          <View style={styles.ruleItem}>
            <Text style={styles.ruleTitle}>👁️ Minimal Data Collection</Text>
            <Text style={styles.ruleDesc}>Guest scanning does not collect personal identity information. Account data is used strictly for saved products and recall safety alerts.</Text>
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
  iconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  cardTitle: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.base,
    color: Colors.text,
  },
  ruleItem: {
    marginBottom: Spacing.md,
  },
  ruleTitle: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.sm + 1,
    color: Colors.text,
    marginBottom: 2,
  },
  ruleDesc: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs + 1,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
