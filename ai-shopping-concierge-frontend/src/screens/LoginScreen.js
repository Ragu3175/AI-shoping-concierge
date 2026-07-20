import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { getProfile } from '../api/profileApi';

export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Please enter email and password');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      // Fetch profile to see if it's empty
      try {
        const profile = await getProfile();
        if (!profile.preferred_styles || profile.preferred_styles.length === 0) {
          navigation.replace('StyleProfile', { isOnboarding: true });
        } else {
          navigation.replace('MainTabs');
        }
      } catch (profileErr) {
        console.error('Error fetching profile after login:', profileErr);
        navigation.replace('MainTabs');
      }
    } catch (err) {
      console.error('Login error details:', err);
      if (err.message && (err.message.includes('Network Error') || err.code === 'ERR_NETWORK' || !err.response)) {
        setErrorMsg("Can't connect to server");
      } else {
        setErrorMsg("Invalid email or password");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="px-6 py-8" showsVerticalScrollIndicator={false}>
          <View className="items-center mb-8">
            <Text className="text-3xl font-bold text-[#1e293b] tracking-tight">Style Concierge</Text>
            <Text className="text-slate-400 text-sm mt-1">Your AI-powered shopping advisor</Text>
          </View>

          {/* Inputs */}
          <View className="gap-4 mb-6">
            <TextInput
              className="bg-white border border-slate-200 rounded-xl p-4 text-[#1e293b] text-base"
              placeholder="Email"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              className="bg-white border border-slate-200 rounded-xl p-4 text-[#1e293b] text-base"
              placeholder="Password"
              placeholderTextColor="#94a3b8"
              secureTextEntry={true}
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {/* Error Message */}
          {errorMsg ? (
            <Text className="text-red-500 text-sm text-center mb-4 font-medium">
              {errorMsg}
            </Text>
          ) : null}

          {/* Login Button */}
          <TouchableOpacity
            className={`w-full py-4 rounded-xl items-center ${isSubmitting ? 'bg-slate-400' : 'bg-[#4f46e5]'}`}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" color="#ffffff" />
                <Text className="text-white text-base font-semibold tracking-wide">Logging in...</Text>
              </View>
            ) : (
              <Text className="text-white text-base font-semibold tracking-wide">Log in</Text>
            )}
          </TouchableOpacity>

          {/* Footer Link */}
          <View className="flex-row mt-6 justify-center">
            <Text className="text-slate-500 text-sm">Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text className="text-[#4f46e5] text-sm font-semibold">Register</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
