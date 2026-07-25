import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { useFonts } from 'expo-font';

export default function App() {
  const [fontsLoaded] = useFonts({
    'PlayfairDisplay-Regular': require('./assets/fonts/PlayfairDisplay-Regular.ttf'),
    'PlayfairDisplay-SemiBold': require('./assets/fonts/PlayfairDisplay-SemiBold.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F6F1E7', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#B08D57" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
