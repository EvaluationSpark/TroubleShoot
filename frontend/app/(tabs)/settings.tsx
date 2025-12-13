import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ImageBackground,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { requestNotificationPermissions, checkNotificationPermissions } from '../utils/notifications';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, themeMode, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(false);
  const scaleAnim = new Animated.Value(1);

  useEffect(() => {
    loadNotificationStatus();
  }, []);

  const loadNotificationStatus = async () => {
    const hasPermission = await checkNotificationPermissions();
    setNotifications(hasPermission);
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

  const handleThemeToggle = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    toggleTheme();
  };

  const MenuItem = ({ icon, title, subtitle, onPress, showArrow = true, rightComponent }: any) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <BlurView
        intensity={theme.colors.glassBlur}
        tint={theme.colors.glassTint}
        style={[styles.menuItem, { borderColor: theme.colors.glassBorder }]}
      >
        <View style={styles.menuLeft}>
          <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.primary}20` }]}>
            <Ionicons name={icon} size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.menuTextContainer}>
            <Text style={[styles.menuTitle, { color: theme.colors.text }]}>{title}</Text>
            {subtitle && <Text style={[styles.menuSubtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>}
          </View>
        </View>
        {rightComponent || (showArrow && <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />)}
      </BlurView>
    </TouchableOpacity>
  );

  return (
    <ImageBackground
      source={{
        uri: theme.mode === 'dark'
          ? 'https://images.unsplash.com/photo-1655393001768-d946c97d6fd1?crop=entropy&cs=srgb&fm=jpg&q=85&w=1080'
          : 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?crop=entropy&cs=srgb&fm=jpg&q=85&w=1080',
      }}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      resizeMode="cover"
    >
      <LinearGradient
        colors={[
          theme.mode === 'dark' ? 'rgba(10, 10, 10, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          theme.mode === 'dark' ? 'rgba(26, 26, 46, 0.9)' : 'rgba(240, 244, 248, 0.9)',
        ]}
        style={styles.gradientOverlay}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Settings</Text>
              <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
                Customize your FixIntel AI experience
              </Text>
            </View>

            {/* App Card */}
            <BlurView
              intensity={theme.colors.glassBlur}
              tint={theme.colors.glassTint}
              style={[styles.appCard, { borderColor: theme.colors.glassBorder }]}
            >
              <LinearGradient
                colors={theme.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.appIconGradient}
              >
                <Text style={styles.appIcon}>🔧</Text>
              </LinearGradient>
              <Text style={[styles.appName, { color: theme.colors.text }]}>FixIntel AI</Text>
              <Text style={[styles.versionText, { color: theme.colors.textSecondary }]}>Version 1.0.0</Text>
              <View style={styles.badgeContainer}>
                <View style={[styles.badge, { backgroundColor: `${theme.colors.success}20` }]}>
                  <Text style={[styles.badgeText, { color: theme.colors.success }]}>AI-Powered</Text>
                </View>
              </View>
            </BlurView>

            {/* Appearance Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Appearance</Text>
              
              <MenuItem
                icon={theme.mode === 'dark' ? 'moon' : 'sunny'}
                title={theme.mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
                subtitle={`Currently using ${theme.mode} theme`}
                showArrow={false}
                rightComponent={
                  <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                    <Switch
                      value={theme.mode === 'dark'}
                      onValueChange={handleThemeToggle}
                      trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                      thumbColor="#fff"
                      ios_backgroundColor={theme.colors.border}
                    />
                  </Animated.View>
                }
              />
            </View>

            {/* Notifications Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Notifications</Text>
              
              <MenuItem
                icon="notifications"
                title="Push Notifications"
                subtitle="Get updates about your repairs"
                showArrow={false}
                rightComponent={
                  <Switch
                    value={notifications}
                    onValueChange={handleNotificationToggle}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    thumbColor="#fff"
                    ios_backgroundColor={theme.colors.border}
                  />
                }
              />
            </View>

            {/* Support Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Support & Legal</Text>
              
              <MenuItem
                icon="help-circle"
                title="Help & Support"
                subtitle="FAQs, tutorials, and contact"
                onPress={() => router.push('/screens/HelpSupportScreen' as any)}
              />
              
              <MenuItem
                icon="document-text"
                title="Terms of Service"
                subtitle="Legal terms and conditions"
                onPress={() => router.push('/screens/TermsOfServiceScreen' as any)}
              />
              
              <MenuItem
                icon="shield-checkmark"
                title="Privacy Policy"
                subtitle="How we protect your data"
                onPress={() => router.push('/screens/PrivacyPolicyScreen' as any)}
              />
            </View>

            {/* About Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>About</Text>
              
              <MenuItem
                icon="information-circle"
                title="About FixIntel AI"
                subtitle="Learn more about our mission"
                onPress={() => Alert.alert('FixIntel AI', 'Intelligent repair assistant powered by advanced AI technology.')}
              />
              
              <MenuItem
                icon="star"
                title="Rate This App"
                subtitle="Share your feedback with us"
                onPress={() => Alert.alert('Thank You!', 'Rate FixIntel AI in the App Store')}
              />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.colors.textTertiary }]}>
                Made with ❤️ by FixIntel Team
              </Text>
              <Text style={[styles.footerText, { color: theme.colors.textTertiary }]}>
                © 2025 FixIntel AI. All rights reserved.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientOverlay: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
  },
  appCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    overflow: 'hidden',
  },
  appIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appIcon: {
    fontSize: 40,
  },
  appName: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 14,
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  footerText: {
    fontSize: 12,
  },
});