import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import StyleProfileScreen from '../screens/StyleProfileScreen';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const [fontsLoaded] = useFonts({
    'PlayfairDisplay-SemiBold': require('../../assets/fonts/PlayfairDisplay-SemiBold.ttf'),
  });

  const headerTitleFont = fontsLoaded ? 'PlayfairDisplay-SemiBold' : (Platform.OS === 'ios' ? 'System' : 'sans-serif');

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        headerStatusBarHeight: 24,
        headerStyle: {
          backgroundColor: '#F6F1E7', // bone
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          fontFamily: headerTitleFont,
          fontSize: 18,
          color: '#1E1B18', // ink
        },
        headerTitleAlign: 'center',
        tabBarActiveTintColor: '#B08D57', // brass
        tabBarInactiveTintColor: '#6B655C', // charcoal60
        tabBarStyle: {
          backgroundColor: '#F6F1E7', // bone
          borderTopWidth: 1,
          borderTopColor: '#E5DFC6', // thin very light bone-on-bone border
          elevation: 0,
          shadowOpacity: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home', headerShown: false }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'History' }} />
      <Tab.Screen name="Profile" component={StyleProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
