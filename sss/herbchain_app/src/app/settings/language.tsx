import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '@/theme';
import { AppHeader } from '@/components/Header';
import Icon from '@/components/Icon';
import { useAuthStore } from '@/store/authStore';
import { setAppLanguage, SUPPORTED_LANGUAGES, type AppLanguage } from '@/i18n';

export default function LanguageSettingsScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();

  const selectedLang = (user?.language as AppLanguage) || 'en';

  const selectLanguage = async (lang: AppLanguage) => {
    updateUser({ language: lang });
    await setAppLanguage(lang);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showBack onBackPress={() => router.back()} title="Language / மொழி" />

      <View style={styles.content}>
        <View style={[styles.card, Shadow.sm]}>
          {SUPPORTED_LANGUAGES.map((lang, i) => (
            <React.Fragment key={lang.code}>
              {i > 0 && <View style={styles.divider} />}
              <TouchableOpacity
                style={[styles.langRow, selectedLang === lang.code && styles.selectedRow]}
                onPress={() => selectLanguage(lang.code)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.langName}>{lang.nativeLabel}</Text>
                  <Text style={styles.langSub}>{lang.label}</Text>
                </View>
                {selectedLang === lang.code && <Icon name="checkmark-circle" size={24} color={Colors.primary} />}
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        <Text style={styles.noteText}>
          Ask AyurTrace+ and the Doctor Portal chat detect and reply in whichever of these languages you type or speak in — no need to switch this setting just to ask a question in a different one.
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
