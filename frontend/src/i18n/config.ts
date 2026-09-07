import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';

const LANGUAGE_STORAGE_KEY = 'agrichain_language';

const getInitialLanguage = (): string => {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved && (saved === 'en' || saved === 'hi')) {
        return saved;
      }
    }
  } catch {
    // Ignore storage parse errors
  }
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export const setAppLanguage = (lng: 'en' | 'hi') => {
  i18n.changeLanguage(lng);
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
    }
  } catch {
    // Ignore
  }
};

export default i18n;
