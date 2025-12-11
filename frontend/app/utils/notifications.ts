import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permission not granted');
      return false;
    }

    // Save permission status
    await AsyncStorage.setItem('notifications_enabled', 'true');
    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

export const checkNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking notification permissions:', error);
    return false;
  }
};

export const scheduleRepairReminder = async (
  repairTitle: string,
  delayInSeconds: number = 3600 // 1 hour default
) => {
  try {
    const hasPermission = await checkNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Repair Reminder \ud83d\udd27',
        body: `Don't forget to continue: ${repairTitle}`,
        data: { type: 'repair_reminder', repairTitle },
      },
      trigger: {
        seconds: delayInSeconds,
      },
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling reminder:', error);
    return null;
  }
};

export const cancelNotification = async (notificationId: string) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
};

export const sendLocalNotification = async (title: string, body: string) => {
  try {
    const hasPermission = await checkNotificationPermissions();
    if (!hasPermission) {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};
