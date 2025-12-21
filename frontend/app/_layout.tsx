import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { loadLanguagePreference } from './i18n';
import SplashScreen from './components/SplashScreen';
import { ThemeProvider } from './contexts/ThemeContext';
import { SkillLevelProvider } from './contexts/SkillLevelContext';
import { UserProvider } from './contexts/UserContext';
import { initializeStorage } from './utils/storage';

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    async function initialize() {
      try {
        // Initialize storage and run migrations
        await initializeStorage();
        
        // Load saved language preference
        await loadLanguagePreference();
        
        setStorageReady(true);
      } catch (error) {
        console.error('Initialization error:', error);
        // Allow app to continue even if initialization fails
        setStorageReady(true);
      }
    }
    
    initialize();
  }, []);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <ThemeProvider>
      <SkillLevelProvider>
        <UserProvider>
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
        </UserProvider>
      </SkillLevelProvider>
    </ThemeProvider>
  );
}
