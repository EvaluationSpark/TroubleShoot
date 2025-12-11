import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import i18n, { saveLanguagePreference } from '../i18n';
import { requestNotificationPermissions, checkNotificationPermissions } from '../utils/notifications';

export default function SettingsScreen() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(false);
  const [language, setLanguage] = useState('English');

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' },
  ];

  useEffect(() => {
    loadNotificationStatus();
    loadCurrentLanguage();
  }, []);

  const loadNotificationStatus = async () => {
    const hasPermission = await checkNotificationPermissions();
    setNotifications(hasPermission);
  };

  const loadCurrentLanguage = () => {
    const currentLang = languages.find(lang => lang.code === i18n.locale);
    if (currentLang) {
      setLanguage(currentLang.name);
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermissions();
      setNotifications(granted);
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive updates.'
        );
      }
    } else {
      setNotifications(false);
      Alert.alert(
        'Notifications Disabled',
        'You can re-enable notifications anytime from settings.'
      );
    }
  };

  const handleLanguageChange = async (lang: { code: string; name: string }) => {
    try {
      await saveLanguagePreference(lang.code);
      setLanguage(lang.name);
      Alert.alert(
        'Language Changed',
        `App language set to ${lang.name}. Some screens may require restart for full effect.`,
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert('Error', 'Failed to change language');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Customize your Pix-Fix experience</Text>
        </View>

        {/* App Version */}
        <View style={styles.versionCard}>
          <View style={styles.appIconContainer}>
            <Ionicons name="construct" size={40} color="#00D9FF" />
          </View>
          <Text style={styles.appName}>Pix-Fix</Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="moon" size={24} color="#00D9FF" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Dark Mode</Text>
                <Text style={styles.settingDescription}>Use dark theme throughout the app</Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#2a2a2a', true: '#00D9FF' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications" size={24} color="#00D9FF" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDescription}>Get updates about your repairs</Text>
              </View>
            </View>
            <Switch
              value={notifications}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: '#2a2a2a', true: '#00D9FF' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Language</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="language" size={24} color="#00D9FF" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>App Language</Text>
                <Text style={styles.settingDescription}>Current: {language}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </View>
          
          {/* Language Options */}
          <View style={styles.languageGrid}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageButton,
                  language === lang.name && styles.languageButtonActive,
                ]}
                onPress={() => handleLanguageChange(lang)}
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    language === lang.name && styles.languageButtonTextActive,
                  ]}
                >
                  {lang.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/screens/HelpSupportScreen')}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="help-circle" size={24} color="#00D9FF" />
              <Text style={styles.settingLabel}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/screens/TermsOfServiceScreen')}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="document-text" size={24} color="#00D9FF" />
              <Text style={styles.settingLabel}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/screens/PrivacyPolicyScreen')}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="shield-checkmark" size={24} color="#00D9FF" />
              <Text style={styles.settingLabel}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Features Info */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featureCard}>
            <Ionicons name="camera" size={24} color="#4ade80" />
            <Text style={styles.featureText}>AI-Powered Image Recognition</Text>
          </View>
          <View style={styles.featureCard}>
            <Ionicons name="book" size={24} color="#4ade80" />
            <Text style={styles.featureText}>Step-by-Step Repair Guides</Text>
          </View>
          <View style={styles.featureCard}>
            <Ionicons name="people" size={24} color="#4ade80" />
            <Text style={styles.featureText}>Community Forum</Text>
          </View>
          <View style={styles.featureCard}>
            <Ionicons name="globe" size={24} color="#4ade80" />
            <Text style={styles.featureText}>Multi-Language Support</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>Made with care for DIY enthusiasts</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#aaa',
  },
  versionCard: {
    backgroundColor: '#1a1a1a',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  appIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  languageButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  languageButtonActive: {
    borderColor: '#00D9FF',
    backgroundColor: '#002a33',
  },
  languageButtonText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '600',
  },
  languageButtonTextActive: {
    color: '#00D9FF',
  },
  featuresSection: {
    marginBottom: 32,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#ccc',
    flex: 1,
  },
  footer: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    marginTop: 20,
    marginBottom: 40,
  },
});
