import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { loadLanguagePreference } from './i18n';
import SplashScreen from './components/SplashScreen';
import { ThemeProvider } from './contexts/ThemeContext';

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Load saved language preference on app start
    loadLanguagePreference();
  }, []);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="screens/HelpSupportScreen" 
          options={{ 
            headerShown: true,
            presentation: 'modal',
            title: 'Help & Support'
          }} 
        />
        <Stack.Screen 
          name="screens/TermsOfServiceScreen" 
          options={{ 
            headerShown: true,
            presentation: 'modal',
            title: 'Terms of Service'
          }} 
        />
        <Stack.Screen 
          name="screens/PrivacyPolicyScreen" 
          options={{ 
            headerShown: true,
            presentation: 'modal',
            title: 'Privacy Policy'
          }} 
        />
      </Stack>
    </ThemeProvider>
  );
}
