import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en.json';
import ta from './ta.json';
import hi from './hi.json';
import kn from './kn.json';
import te from './te.json';
import tcy from './tcy.json';

export type AppLanguage = 'en' | 'ta' | 'hi' | 'kn' | 'te' | 'tcy';

export const SUPPORTED_LANGUAGES: { code: AppLanguage; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'tcy', label: 'Tulu', nativeLabel: 'ತುಳು' },
];

const LANGUAGE_STORAGE_KEY = 'ayurtrace_language';
const SUPPORTED_CODES = SUPPORTED_LANGUAGES.map((l) => l.code);

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ta: { translation: ta },
    hi: { translation: hi },
    kn: { translation: kn },
    te: { translation: te },
    tcy: { translation: tcy },
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
    if (saved && SUPPORTED_CODES.includes(saved as AppLanguage)) {
      await i18n.changeLanguage(saved);
    }
  } catch {
    // No persisted preference yet — default 'en' stands.
  }
}

export async function setAppLanguage(lang: AppLanguage): Promise<void> {
  await i18n.changeLanguage(lang);
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // Non-fatal — the in-memory language change still applies this session.
  }
}

export default i18n;
