import { I18n } from 'i18n-js';
import { translations } from './translations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

const i18n = new I18n(translations);

// Set the locale once at the beginning of your app.
i18n.locale = getLocales()[0].languageCode || 'en';

// When a value is missing from a language it'll fall back to another language with the key present.
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

// Load saved language preference
export const loadLanguagePreference = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('app_language');
    if (savedLanguage) {
      i18n.locale = savedLanguage;
    }
  } catch (error) {
    console.error('Error loading language preference:', error);
  }
};

// Save language preference
export const saveLanguagePreference = async (language: string) => {
  try {
    await AsyncStorage.setItem('app_language', language);
    i18n.locale = language;
  } catch (error) {
    console.error('Error saving language preference:', error);
  }
};

export default i18n;
