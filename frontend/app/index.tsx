import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainNavigator from './navigation/MainNavigator';

export default function Index() {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <MainNavigator />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
});
