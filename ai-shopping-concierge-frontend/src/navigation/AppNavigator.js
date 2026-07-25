import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import StyleProfileScreen from '../screens/StyleProfileScreen';
import MainTabs from './MainTabs';
import LoadingScreen from '../screens/LoadingScreen';
import StyleBoardScreen from '../screens/StyleBoardScreen';
import { useFonts } from 'expo-font';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [fontsLoaded] = useFonts({
    'PlayfairDisplay-SemiBold': require('../../assets/fonts/PlayfairDisplay-SemiBold.ttf'),
  });

  const headerTitleFont = fontsLoaded ? 'PlayfairDisplay-SemiBold' : (Platform.OS === 'ios' ? 'System' : 'sans-serif');

  return (
    <Stack.Navigator 
      initialRouteName="Login"
      screenOptions={{
        headerStatusBarHeight: 24,
        headerStyle: {
          backgroundColor: '#F6F1E7', // bone
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontFamily: headerTitleFont,
          fontSize: 18,
          color: '#1E1B18', // ink
        },
        headerTitleAlign: 'center',
        headerBackTitleVisible: false,
        headerTintColor: '#1E1B18', // ink
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Sign In' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
      <Stack.Screen name="StyleProfile" component={StyleProfileScreen} options={{ title: 'Style Profile' }} />
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Loading" component={LoadingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="StyleBoard" component={StyleBoardScreen} options={{ title: 'Style Board' }} />
    </Stack.Navigator>
  );
}
