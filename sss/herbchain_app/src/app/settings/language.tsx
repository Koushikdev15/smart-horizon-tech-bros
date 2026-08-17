import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '@/theme';
import { AppHeader } from '@/components/Header';
import Icon from '@/components/Icon';
import { useAuthStore } from '@/store/authStore';
import { setAppLanguage } from '@/i18n';

export default function LanguageSettingsScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();

  const selectedLang = user?.language || 'en';

  const selectLanguage = async (lang: 'en' | 'ta') => {
    updateUser({ language: lang });
    await setAppLanguage(lang);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showBack onBackPress={() => router.back()} title="Language / மொழி" />

      <View style={styles.content}>
        <View style={[styles.card, Shadow.sm]}>
          <TouchableOpacity
            style={[styles.langRow, selectedLang === 'en' && styles.selectedRow]}
            onPress={() => selectLanguage('en')}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.langName}>English</Text>
              <Text style={styles.langSub}>Default Application Language</Text>
            </View>
            {selectedLang === 'en' && <Icon name="checkmark-circle" size={24} color={Colors.primary} />}
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={[styles.langRow, selectedLang === 'ta' && styles.selectedRow]}
            onPress={() => selectLanguage('ta')}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.langName}>தமிழ் (Tamil)</Text>
              <Text style={styles.langSub}>தமிழ் மொழியில் அப்ளிகேஷன்</Text>
            </View>
            {selectedLang === 'ta' && <Icon name="checkmark-circle" size={24} color={Colors.primary} />}
          </TouchableOpacity>
        </View>

        <Text style={styles.noteText}>
          Support for more Indian languages (Hindi, Malayalam, Telugu, Kannada) will be added in future updates.
        </Text>
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
    padding: Spacing.base,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    marginTop: Spacing.md,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  selectedRow: {
    backgroundColor: Colors.lightGreen + '60',
  },
  langName: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.base,
    color: Colors.text,
  },
  langSub: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
  },
  noteText: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.lg,
    lineHeight: 18,
  },
});
