import React, { useState, useContext, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Header dynamic configuration
  useEffect(() => {
    navigation.setOptions({
      title: 'Create Account',
    });
  }, [navigation]);

  // Focus and Border Animations
  const [nameFocused, setNameFocused] = useState(false);
  const nameBorderAnim = useRef(new Animated.Value(0)).current;

  const [emailFocused, setEmailFocused] = useState(false);
  const emailBorderAnim = useRef(new Animated.Value(0)).current;

  const [passwordFocused, setPasswordFocused] = useState(false);
  const passwordBorderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(nameBorderAnim, {
      toValue: nameFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [nameFocused]);

  useEffect(() => {
    Animated.timing(emailBorderAnim, {
      toValue: emailFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [emailFocused]);

  useEffect(() => {
    Animated.timing(passwordBorderAnim, {
      toValue: passwordFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [passwordFocused]);

  const nameBorderColor = nameBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(107, 101, 92, 0.2)', '#B08D57'],
  });

  const emailBorderColor = emailBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(107, 101, 92, 0.2)', '#B08D57'],
  });

  const passwordBorderColor = passwordBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(107, 101, 92, 0.2)', '#B08D57'],
  });

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
    <SafeAreaView className="flex-1 bg-bone" edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="px-8 py-12" showsVerticalScrollIndicator={false}>
          {/* Logo / Header Area */}
          <View className="items-center mb-12">
            <View className="flex-row items-center gap-3 mb-2">
              <Text style={{ fontFamily: 'PlayfairDisplay-SemiBold' }} className="text-4xl text-ink tracking-tight">Create Account</Text>
              {/* Static non-interactive decorative SwingTag */}
              <View style={{ transform: [{ rotate: '-8deg' }] }} className="w-5 h-8 bg-brass rounded-sm relative justify-center items-center">
                <View className="absolute top-1.5 w-1.5 h-1.5 rounded-full bg-bone" />
              </View>
            </View>
            <Text className="text-charcoal60 text-xs tracking-widest uppercase font-medium">Get started with Style Concierge</Text>
          </View>

          {/* Inputs */}
          <View className="gap-6 mb-8">
            <View className="relative pb-1">
              <TextInput
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                className="py-3 text-ink text-base font-normal"
                placeholder="Name"
                placeholderTextColor="#6B655C"
                autoCapitalize="words"
                value={name}
                onChangeText={setName}
              />
              <Animated.View style={{ height: 1.5, backgroundColor: nameBorderColor, position: 'absolute', bottom: 0, left: 0, right: 0 }} />
            </View>

            <View className="relative pb-1">
              <TextInput
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                className="py-3 text-ink text-base font-normal"
                placeholder="Email"
                placeholderTextColor="#6B655C"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              <Animated.View style={{ height: 1.5, backgroundColor: emailBorderColor, position: 'absolute', bottom: 0, left: 0, right: 0 }} />
            </View>

            <View className="relative pb-1">
              <TextInput
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                className="py-3 text-ink text-base font-normal"
                placeholder="Password"
                placeholderTextColor="#6B655C"
                secureTextEntry={true}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
              />
              <Animated.View style={{ height: 1.5, backgroundColor: passwordBorderColor, position: 'absolute', bottom: 0, left: 0, right: 0 }} />
            </View>
          </View>

          {/* Error Message */}
          {errorMsg ? (
            <Text className="text-clay text-sm text-center mb-6 font-medium">
              {errorMsg}
            </Text>
          ) : null}

          {/* Create Button */}
          <TouchableOpacity
            className={`w-full py-4 rounded-sm items-center shadow-none ${isSubmitting ? 'bg-brass/60' : 'bg-brass'}`}
            onPress={handleRegister}
            activeOpacity={0.85}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" color="#F6F1E7" />
                <Text className="text-bone text-base font-semibold tracking-widest uppercase">Creating account...</Text>
              </View>
            ) : (
              <Text className="text-bone text-base font-semibold tracking-widest uppercase">Create account</Text>
            )}
          </TouchableOpacity>

          {/* Footer Link */}
          <View className="flex-row mt-8 justify-center">
            <Text className="text-charcoal60 text-sm">Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text className="text-brass text-sm font-semibold">Log in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
