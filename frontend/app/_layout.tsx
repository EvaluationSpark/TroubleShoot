import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { loadLanguagePreference } from './i18n';

export default function RootLayout() {
  useEffect(() => {
    // Load saved language preference on app start
    loadLanguagePreference();
  }, []);

  return (
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
  );
}
