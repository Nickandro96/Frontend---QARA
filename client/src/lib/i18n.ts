import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import fr from '../locales/fr.json';
import en from '../locales/en.json';

const resources = {
  fr: { translation: fr },
  en: { translation: en }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    supportedLngs: ['fr', 'en'],
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng'
    },

    interpolation: {
      escapeValue: false // React already escapes values
    },

    react: {
      useSuspense: false
    }
  });

export default i18n;

// Helper function to change language
export const changeLanguage = (lng: 'fr' | 'en') => {
  i18n.changeLanguage(lng);
  localStorage.setItem('i18nextLng', lng);
  // Update HTML lang attribute
  document.documentElement.lang = lng;
};

// Get current language
export const getCurrentLanguage = (): 'fr' | 'en' => {
  return (i18n.language?.substring(0, 2) as 'fr' | 'en') || 'fr';
};
