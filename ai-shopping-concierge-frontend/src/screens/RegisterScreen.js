import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setErrorMsg('Please fill in all fields');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await register(name, email, password);
      navigation.replace('StyleProfile', { isOnboarding: true }); // onboarding flow
    } catch (err) {
      console.error('Registration error details:', err);
      if (err.message && (err.message.includes('Network Error') || err.code === 'ERR_NETWORK' || !err.response)) {
        setErrorMsg("Can't connect to server");
      } else if (err.response && err.response.status === 400) {
        setErrorMsg("Email already registered");
      } else {
        setErrorMsg("Registration failed. Please try again.");
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
            <Text className="text-3xl font-bold text-[#1e293b] tracking-tight">Create Account</Text>
            <Text className="text-slate-400 text-sm mt-1">Get started with Style Concierge</Text>
          </View>

          {/* Inputs */}
          <View className="gap-4 mb-6">
            <TextInput
              className="bg-white border border-slate-200 rounded-xl p-4 text-[#1e293b] text-base"
              placeholder="Name"
              placeholderTextColor="#94a3b8"
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
            />
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

          {/* Create Button */}
          <TouchableOpacity
            className={`w-full py-4 rounded-xl items-center ${isSubmitting ? 'bg-slate-400' : 'bg-[#4f46e5]'}`}
            onPress={handleRegister}
            activeOpacity={0.85}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" color="#ffffff" />
                <Text className="text-white text-base font-semibold tracking-wide">Creating account...</Text>
              </View>
            ) : (
              <Text className="text-white text-base font-semibold tracking-wide">Create account</Text>
            )}
          </TouchableOpacity>

          {/* Footer Link */}
          <View className="flex-row mt-6 justify-center">
            <Text className="text-slate-500 text-sm">Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text className="text-[#4f46e5] text-sm font-semibold">Log in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
