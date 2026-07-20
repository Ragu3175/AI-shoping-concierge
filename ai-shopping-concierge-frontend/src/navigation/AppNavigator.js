import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import StyleProfileScreen from '../screens/StyleProfileScreen';
import MainTabs from './MainTabs';
import LoadingScreen from '../screens/LoadingScreen';
import StyleBoardScreen from '../screens/StyleBoardScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator 
      initialRouteName="Login"
      screenOptions={{
        headerStatusBarHeight: 24,
        headerStyle: {
          backgroundColor: '#fafafa',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontSize: 17,
          fontWeight: '500',
          color: '#1e293b',
        },
        headerTitleAlign: 'center',
        headerBackTitleVisible: false,
        headerTintColor: '#1e293b',
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
