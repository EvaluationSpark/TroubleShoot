import { I18n } from 'i18n-js';
import { translations } from './translations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

const i18n = new I18n(translations);

// Set the locale once at the beginning of your app.
const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';
i18n.locale = deviceLanguage;

// When a value is missing from a language it'll fall back to another language with the key present.
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

// Load saved language preference
export const loadLanguagePreference = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('app_language');
    if (savedLanguage) {
      i18n.locale = savedLanguage;
      console.log('Loaded language preference:', savedLanguage);
    } else {
      console.log('Using device language:', deviceLanguage);
    }
  } catch (error) {
    console.error('Error loading language preference:', error);
  }
};

// Save language preference and update locale
export const saveLanguagePreference = async (language: string) => {
  try {
    await AsyncStorage.setItem('app_language', language);
    i18n.locale = language;
    console.log('Language preference saved:', language);
    return true;
  } catch (error) {
    console.error('Error saving language preference:', error);
    return false;
  }
};

// Get current language
export const getCurrentLanguage = () => {
  return i18n.locale;
};

export default i18n;
