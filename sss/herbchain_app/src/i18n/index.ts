import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en.json';
import ta from './ta.json';

const LANGUAGE_STORAGE_KEY = 'ayurtrace_language';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ta: { translation: ta },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  // Hermes' Intl.PluralRules support needs this compatibility mode, or
  // i18next's pluralization throws on RN.
  compatibilityJSON: 'v4',
});

/** Call once on app start — restores whichever language the user last picked. */
export async function loadPersistedLanguage(): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === 'en' || saved === 'ta') {
      await i18n.changeLanguage(saved);
    }
  } catch {
    // No persisted preference yet — default 'en' stands.
  }
}

export async function setAppLanguage(lang: 'en' | 'ta'): Promise<void> {
  await i18n.changeLanguage(lang);
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // Non-fatal — the in-memory language change still applies this session.
  }
}

export default i18n;
