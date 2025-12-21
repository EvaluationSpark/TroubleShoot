import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

interface UserContextType {
  userId: string;
  setUserId: (id: string) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_ID_KEY = '@fixintel_user_id';

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserIdState] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrCreateUserId();
  }, []);

  const loadOrCreateUserId = async () => {
    try {
      // Try to load existing user ID
      let storedUserId = await AsyncStorage.getItem(USER_ID_KEY);
      
      if (!storedUserId) {
        // Generate a new unique user ID using expo-crypto
        const randomBytes = await Crypto.getRandomBytesAsync(16);
        storedUserId = Array.from(randomBytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        
        // Save it for future use
        await AsyncStorage.setItem(USER_ID_KEY, storedUserId);
        console.log('[User] Created new user ID:', storedUserId);
      } else {
        console.log('[User] Loaded existing user ID:', storedUserId);
      }
      
      setUserIdState(storedUserId);
    } catch (error) {
      console.error('[User] Error loading/creating user ID:', error);
      // Fallback to a timestamp-based ID
      const fallbackId = `user_${Date.now()}`;
      setUserIdState(fallbackId);
    } finally {
      setIsLoading(false);
    }
  };

  const setUserId = async (newId: string) => {
    try {
      await AsyncStorage.setItem(USER_ID_KEY, newId);
      setUserIdState(newId);
    } catch (error) {
      console.error('[User] Error saving user ID:', error);
    }
  };

  return (
    <UserContext.Provider value={{ userId, setUserId, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export default UserContext;
