import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

interface ThemeColors {
  // Backgrounds
  background: string;
  backgroundGradientStart: string;
  backgroundGradientEnd: string;
  cardBackground: string;
  glassBackground: string;
  
  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Accent colors
  accent: string;
  accentLight: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // UI Elements
  border: string;
  shadow: string;
  overlay: string;
  
  // Glass effects
  glassBlur: number;
  glassTint: 'light' | 'dark';
  glassBorder: string;
}

interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  gradients: {
    primary: string[];
    accent: string[];
    background: string[];
    card: string[];
  };
}

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const lightTheme: ThemeColors = {
  // Backgrounds
  background: '#FFFFFF',
  backgroundGradientStart: '#FFFFFF',
  backgroundGradientEnd: '#F0F4F8',
  cardBackground: '#FFFFFF',
  glassBackground: 'rgba(255, 255, 255, 0.7)',
  
  // Text
  text: '#1A1A1A',
  textSecondary: '#4A5568',
  textTertiary: '#718096',
  
  // Primary colors
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',
  
  // Accent colors
  accent: '#7C3AED',
  accentLight: '#8B5CF6',
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#06B6D4',
  
  // UI Elements
  border: 'rgba(0, 0, 0, 0.1)',
  shadow: 'rgba(0, 0, 0, 0.15)',
  overlay: 'rgba(0, 0, 0, 0.3)',
  
  // Glass effects
  glassBlur: 15,
  glassTint: 'light' as const,
  glassBorder: 'rgba(255, 255, 255, 0.3)',
};

const darkTheme: ThemeColors = {
  // Backgrounds
  background: '#0A0A0A',
  backgroundGradientStart: '#0A0A0A',
  backgroundGradientEnd: '#1A1A2E',
  cardBackground: '#1A1A1A',
  glassBackground: 'rgba(26, 26, 26, 0.7)',
  
  // Text
  text: '#FFFFFF',
  textSecondary: '#A0AEC0',
  textTertiary: '#718096',
  
  // Primary colors
  primary: '#00D9FF',
  primaryLight: '#33E0FF',
  primaryDark: '#00B8D9',
  
  // Accent colors
  accent: '#9D4EDD',
  accentLight: '#B57EE5',
  
  // Status colors
  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#06B6D4',
  
  // UI Elements
  border: 'rgba(255, 255, 255, 0.1)',
  shadow: 'rgba(0, 217, 255, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  
  // Glass effects
  glassBlur: 15,
  glassTint: 'dark' as const,
  glassBorder: 'rgba(255, 255, 255, 0.1)',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@fixintel_theme_mode';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemeModeState(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  const currentColors = themeMode === 'dark' ? darkTheme : lightTheme;

  const theme: Theme = {
    mode: themeMode,
    colors: currentColors,
    gradients: {
      primary: themeMode === 'dark' 
        ? ['#00D9FF', '#0099CC', '#006699']
        : ['#3B82F6', '#2563EB', '#1D4ED8'],
      accent: themeMode === 'dark'
        ? ['#9D4EDD', '#7C3AED', '#6D28D9']
        : ['#8B5CF6', '#7C3AED', '#6D28D9'],
      background: themeMode === 'dark'
        ? ['#0A0A0A', '#1A1A2E', '#16213E']
        : ['#FFFFFF', '#F0F4F8', '#E2E8F0'],
      card: themeMode === 'dark'
        ? ['rgba(26, 26, 26, 0.9)', 'rgba(42, 42, 42, 0.8)']
        : ['rgba(255, 255, 255, 0.9)', 'rgba(248, 250, 252, 0.8)'],
    },
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
