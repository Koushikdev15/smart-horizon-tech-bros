import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '@/theme';
import { AppHeader } from '@/components/Header';
import Icon from '@/components/Icon';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { GuestGate } from '@/components/GuestGate';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <Text style={styles.para}>{children}</Text>;
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [deleting, setDeleting] = useState(false);

  function confirmDeleteAccount() {
    Alert.alert(
      'Delete your account permanently?',
      'This deletes your entire AyurTrace+ account — profile, health data, scan and chat history, orders, forum posts, and reviews. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Account', style: 'destructive', onPress: handleDeleteAccount },
      ]
    );
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await authService.deleteAccount();
      await logout();
      router.replace('/login');
    } catch {
      Alert.alert('Could not delete account', 'Something went wrong. Please check your connection and try again.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showBack onBackPress={() => router.back()} title="Privacy Policy" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.effectiveDate}>Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>

        <Section title="Who this policy covers">
          <P>
            This policy explains what personal data the AyurTrace+ mobile app collects, why, how long it is kept,
            who else can see it, and the rights you have over it under India's Digital Personal Data Protection Act,
            2023 ("DPDP Act"). AyurTrace+ acts as the Data Fiduciary for the personal data described here.
          </P>
        </Section>

        <Section title="What we collect">
          <Bullet>
            <Text style={styles.bulletLabel}>Account details: </Text>
            name, email, phone number, date of birth, and — if you provide them — the last four digits of a
            government ID, occupation, and religion, collected at sign-up to create your account and Ayurvedic ID.
          </Bullet>
          <Bullet>
            <Text style={styles.bulletLabel}>Health profile (sensitive personal data): </Text>
            allergies, existing conditions, current medications, and pregnancy/breastfeeding status, collected only
            if you choose to fill it in, used solely to flag potential allergy conflicts and product suitability for
            you. This section can never be seen by other users.
          </Bullet>
          <Bullet>
            <Text style={styles.bulletLabel}>Location: </Text>
            requested only when you use "find nearby stores," "find nearby doctors," or ask the AI assistant a
            location-based question — used for that single request and not stored afterward.
          </Bullet>
          <Bullet>
            <Text style={styles.bulletLabel}>Scan and order history: </Text>
            products you scan or verify, and purchases you make through E-Buy, kept so you can see your own history
            and re-order.
          </Bullet>
          <Bullet>
            <Text style={styles.bulletLabel}>AI assistant conversations: </Text>
            messages you send to Ask AyurTrace+ or a doctor-consult chat, including any voice recording, photo, or
            document you attach for that message. Voice recordings and attached files are processed for a single
            reply and are never saved — only the resulting text is kept, and only for 3 days (see "How long we keep
            data" below).
          </Bullet>
          <Bullet>
            <Text style={styles.bulletLabel}>Content you post: </Text>
            forum questions/thoughts, comments, and product reviews you choose to publish are visible to other
            users, same as any public post on a community platform.
          </Bullet>
        </Section>

        <Section title="Why we process it">
          <P>
            Account and order data is processed to provide the service you're using — creating your account,
            verifying products, and fulfilling purchases. Health profile data is processed only with your explicit,
            separately-revocable consent (see the two consent toggles in Health Profile) to power the allergy and
            suitability checks. Location is processed transiently, on your explicit request each time, for the
            single nearby-search or chat query you made.
          </P>
        </Section>

        <Section title="How long we keep data">
          <Bullet>AI chat sessions and messages are automatically and permanently deleted 3 days after the last message in that conversation.</Bullet>
          <Bullet>Voice recordings and attached photos/documents sent to the AI assistant are never stored at all — they exist only in memory for the single request that uses them.</Bullet>
          <Bullet>Health profile data is kept until you delete it (Health Profile → Delete My Health Data) or delete your account.</Bullet>
          <Bullet>Account, scan history, order, forum, and review data is kept until you delete your account.</Bullet>
        </Section>

        <Section title="Who we share it with">
          <P>
            We do not sell personal data. Limited, purpose-specific sharing happens with the service providers that
            run the app:
          </P>
          <Bullet><Text style={styles.bulletLabel}>Supabase</Text> — hosts your account, health profile, chat history, and orders, secured with row-level access rules so only you can read your own rows.</Bullet>
          <Bullet><Text style={styles.bulletLabel}>Google Gemini (AI)</Text> — receives the text, voice, or image content of a message only when you send it to the AI assistant, in order to generate that one reply. It is not used to store a profile of you.</Bullet>
          <Bullet><Text style={styles.bulletLabel}>MongoDB Atlas</Text> — hosts the product catalog, store directory, and order records used to fulfil purchases.</Bullet>
          <P>We may also disclose data if legally required to by an Indian court, regulator, or law-enforcement request.</P>
        </Section>

        <Section title="Your rights under the DPDP Act">
          <Bullet><Text style={styles.bulletLabel}>Right to access</Text> — see what personal data we hold about you, via your Profile and Health Profile screens.</Bullet>
          <Bullet><Text style={styles.bulletLabel}>Right to correction</Text> — edit your account and health profile details at any time.</Bullet>
          <Bullet><Text style={styles.bulletLabel}>Right to erasure</Text> — delete your health data alone (Health Profile) or your entire account (below), at any time, without needing to give a reason.</Bullet>
          <Bullet><Text style={styles.bulletLabel}>Right to withdraw consent</Text> — turn off health-data storage or personalized alerts at any time from Health Profile; this does not affect the lawfulness of processing before withdrawal.</Bullet>
          <Bullet><Text style={styles.bulletLabel}>Right to nominate</Text> — you may nominate another individual to exercise these rights on your behalf in the event of your death or incapacity, by contacting the Grievance Officer below.</Bullet>
          <Bullet><Text style={styles.bulletLabel}>Right to grievance redressal</Text> — raise a complaint with our Grievance Officer, and escalate to the Data Protection Board of India if unresolved.</Bullet>
        </Section>

        <Section title="Children">
          <P>
            AyurTrace+ is not directed at, and does not knowingly collect personal data from, anyone under 18. Health
            profile date-of-birth entries are validated to require an adult.
          </P>
        </Section>

        <Section title="Security">
          <P>
            Passwords and session tokens are never stored in plain text. Health data access is restricted at the
            database level so only your own account can read it — not other users, and not by default even our own
            admin tools. If a breach affecting your personal data occurs, we will notify affected users and the Data
            Protection Board of India as required by law.
          </P>
        </Section>

        <Section title="Grievance Officer">
          <P>
            [To be completed by AyurTrace+ before publishing: name, email, and postal address of the designated
            Grievance Officer, as required under the DPDP Act.]
          </P>
        </Section>

        <Section title="Changes to this policy">
          <P>
            If this policy changes materially, we will notify you in-app before the change takes effect. Continuing
            to use AyurTrace+ after that point means you accept the updated policy.
          </P>
        </Section>

        <View style={styles.legalNote}>
          <Icon name="information-circle-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.legalNoteText}>
            This policy was drafted to accurately reflect what the app technically does, but it is not a substitute
            for review by a qualified lawyer before publishing to real users.
          </Text>
        </View>

        <GuestGate message="Sign in to manage or delete your account.">
          <View style={[styles.dangerCard, Shadow.sm]}>
            <View style={styles.dangerHeader}>
              <Icon name="trash-outline" size={20} color={Colors.error} />
              <Text style={styles.dangerTitle}>Delete My Account</Text>
            </View>
            <Text style={styles.dangerDesc}>
              Permanently deletes your entire account — not just your health profile — including scan history,
              chats, orders, forum posts, and reviews. This cannot be undone.
            </Text>
            <TouchableOpacity style={styles.dangerBtn} onPress={confirmDeleteAccount} disabled={deleting}>
              {deleting ? <ActivityIndicator color={Colors.error} /> : <Text style={styles.dangerBtnText}>Delete My Account</Text>}
            </TouchableOpacity>
          </View>
        </GuestGate>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  scrollContent: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, paddingBottom: Spacing['3xl'] },
  effectiveDate: { fontFamily: Fonts.family.regular, fontSize: 11, color: Colors.textMuted, marginBottom: Spacing.md },
  section: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  sectionTitle: { fontFamily: Fonts.family.bold, fontSize: Fonts.size.sm + 1, color: Colors.primary, marginBottom: Spacing.sm },
  para: { fontFamily: Fonts.family.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginBottom: Spacing.xs },
  bulletRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  bulletDot: { fontFamily: Fonts.family.regular, fontSize: 13, color: Colors.primary },
  bulletText: { flex: 1, fontFamily: Fonts.family.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  bulletLabel: { fontFamily: Fonts.family.semiBold, color: Colors.onSurface },
  legalNote: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  legalNoteText: { flex: 1, fontFamily: Fonts.family.regular, fontSize: 11, color: Colors.textMuted, lineHeight: 16 },
  dangerCard: {
    backgroundColor: Colors.errorContainer,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },
  dangerHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.xs },
  dangerTitle: { fontFamily: Fonts.family.bold, fontSize: Fonts.size.sm + 1, color: Colors.error },
  dangerDesc: { fontFamily: Fonts.family.regular, fontSize: 12, color: Colors.onErrorContainer, lineHeight: 17, marginBottom: Spacing.md },
  dangerBtn: {
    borderWidth: 1.5,
    borderColor: Colors.error,
    borderRadius: BorderRadius.full,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dangerBtnText: { fontFamily: Fonts.family.semiBold, fontSize: 13, color: Colors.error },
});
