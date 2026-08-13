import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '@/theme';
import { AppHeader } from '@/components/Header';
import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import Icon from '@/components/Icon';

export default function QRNotFoundScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showBack onBackPress={() => router.back()} title="Verification Notice" />

      <View style={styles.content}>
        <View style={[styles.card, Shadow.md]}>
          <View style={styles.iconCircle}>
            <Icon name="help-outline" size={48} color={Colors.warning} />
          </View>

          <Text style={styles.title}>QR Code Not Recognized</Text>

          <Text style={styles.desc}>
            This QR code could not be matched with a registered AyurTrace+ product in our blockchain database.
          </Text>

          <View style={styles.noteBox}>
            <Icon name="shield-outline" size={16} color={Colors.textMuted} style={{ marginRight: 6 }} />
            <Text style={styles.noteText}>
              Note: Unrecognized QR codes may occur due to damaged packaging, old batches, or unregistered sellers. It does not automatically confirm counterfeiting.
            </Text>
          </View>

          <View style={styles.actionColumn}>
            <PrimaryButton
              title="Scan Again"
              onPress={() => router.replace('/(tabs)/scan')}
              icon="camera-outline"
              size="lg"
            />

            <SecondaryButton
              title="Enter Batch ID Manually"
              onPress={() => router.push('/verify/manual')}
              icon="keypad-outline"
              size="lg"
            />

            <SecondaryButton
              title="Report Product Issue"
              onPress={() => router.push('/report')}
              icon="flag-outline"
              size="lg"
              style={{ backgroundColor: Colors.tertiaryFixed, borderColor: Colors.tertiaryFixedDim }}
              textStyle={{ color: Colors.warning }}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.tertiaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: Fonts.family.serifSemiBold,
    fontSize: Fonts.size.xl,
    color: Colors.text,
    textAlign: 'center',
  },
  desc: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cream,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginVertical: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noteText: {
    flex: 1,
    fontFamily: Fonts.family.regular,
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  actionColumn: {
    width: '100%',
    gap: Spacing.sm,
  },
});
