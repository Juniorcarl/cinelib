import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { AppNavigator } from './src/app/navigation/AppNavigator';
import { runMigrations } from './src/database';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  useEffect(() => {
    runMigrations().catch(console.error);
  }, []);

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}