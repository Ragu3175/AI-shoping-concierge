import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Animated, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../context/AuthContext';
import { getProfile, updateProfile, uploadProfilePicture } from '../api/profileApi';
import SwingTag from '../components/SwingTag';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.23:8000';

export default function StyleProfileScreen({ route, navigation }) {
  const { logout, user, setUser } = useContext(AuthContext);
  
  // Resolve isOnboarding param, defaults to false when accessed via tab navigator
  const isOnboarding = route.params?.isOnboarding ?? false;

  const [selectedTags, setSelectedTags] = useState([]);
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const toastOpacity = useRef(new Animated.Value(0)).current;

  // Header dynamic configuration
  useEffect(() => {
    navigation.setOptions({
      title: isOnboarding ? 'Style Profile' : 'Profile',
    });
  }, [navigation, isOnboarding]);

  // Focus and Border Animations for Budget Inputs
  const [minBudgetFocused, setMinBudgetFocused] = useState(false);
  const minBudgetBorderAnim = useRef(new Animated.Value(0)).current;

  const [maxBudgetFocused, setMaxBudgetFocused] = useState(false);
  const maxBudgetBorderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(minBudgetBorderAnim, {
      toValue: minBudgetFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [minBudgetFocused]);

  useEffect(() => {
    Animated.timing(maxBudgetBorderAnim, {
      toValue: maxBudgetFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [maxBudgetFocused]);

  const minBudgetBorderColor = minBudgetBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(107, 101, 92, 0.2)', '#B08D57'],
  });

  const maxBudgetBorderColor = maxBudgetBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(107, 101, 92, 0.2)', '#B08D57'],
  });

  const styleTags = [
    "Minimal", 
    "Formal", 
    "Streetwear", 
    "Casual", 
    "Athleisure", 
    "Vintage", 
    "Bold", 
    "Classic"
  ];

  // Prefill values depending on screen context
  useEffect(() => {
    if (!isOnboarding) {
      const fetchProfile = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
          const profile = await getProfile();
          setSelectedTags(profile.preferred_styles || []);
          setMinBudget(profile.budget_min ? String(profile.budget_min) : '');
          setMaxBudget(profile.budget_max ? String(profile.budget_max) : '');
        } catch (err) {
          console.error('Error fetching profile:', err);
          if (err.message && (err.message.includes('Network Error') || err.code === 'ERR_NETWORK' || !err.response)) {
            setErrorMsg("Can't connect to server");
          } else {
            setErrorMsg("Failed to load profile settings");
          }
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    } else {
      setSelectedTags([]);
      setMinBudget('');
      setMaxBudget('');
    }
  }, [isOnboarding]);

  const handleToggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSave = async () => {
    setErrorMsg('');
    setSaving(true);
    try {
      await updateProfile(selectedTags, minBudget, maxBudget);
      if (isOnboarding) {
        navigation.replace('MainTabs');
      } else {
        // Trigger floating confirmation toast animation
        toastOpacity.setValue(1);
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 1000,
          delay: 1000,
          useNativeDriver: true,
        }).start();
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      if (err.message && (err.message.includes('Network Error') || err.code === 'ERR_NETWORK' || !err.response)) {
        setErrorMsg("Can't connect to server");
      } else {
        setErrorMsg("Failed to save changes");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  const handlePickImage = async () => {
    setErrorMsg('');
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access library is required to upload a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSaving(true);
        const uploadResult = await uploadProfilePicture(result.assets[0].uri);
        setUser(prev => ({
          ...prev,
          profile_picture_url: uploadResult.profile_picture_url
        }));
      }
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      if (err.message && (err.message.includes('Network Error') || err.code === 'ERR_NETWORK' || !err.response)) {
        setErrorMsg("Can't connect to server");
      } else {
        setErrorMsg("Failed to upload profile picture");
      }
    } finally {
      setSaving(false);
    }
  };

  const getProfilePictureUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${API_BASE}${path}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-bone" edges={['bottom', 'left', 'right']}>
      {loading ? (
        <View className="flex-1 justify-center items-center bg-bone">
          <ActivityIndicator size="large" color="#B08D57" />
          <Text className="text-charcoal60 mt-2 font-medium">Loading preferences...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View className="px-6 py-6 flex-1 justify-between">
            <View>
              {/* Account Details Panel (Visible only when viewed inside persistent Profile Tab) */}
              {!isOnboarding && (
                <View className="bg-white border border-[#EADFC9] rounded-xl p-5 mb-8">
                  <Text className="text-charcoal60 text-xs font-bold uppercase tracking-widest mb-4">
                    Account Details
                  </Text>
                  <View className="flex-row items-center gap-4 mb-4">
                    <TouchableOpacity onPress={handlePickImage} activeOpacity={0.7} className="relative">
                      <View className="w-16 h-16 rounded-full border border-brass p-0.5 justify-center items-center">
                        {user?.profile_picture_url ? (
                          <Image 
                            source={{ uri: getProfilePictureUrl(user.profile_picture_url) }} 
                            className="w-full h-full rounded-full bg-bone" 
                          />
                        ) : (
                          <View className="w-full h-full rounded-full bg-bone justify-center items-center">
                            <Text className="text-charcoal60 text-[9px] font-bold tracking-wider uppercase text-center">
                              No Photo
                            </Text>
                          </View>
                        )}
                      </View>
                      <View className="absolute bottom-0 right-0 bg-brass rounded-full p-1 shadow-sm">
                        <Text className="text-[8px] text-bone">📸</Text>
                      </View>
                    </TouchableOpacity>
                    
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-ink">{user?.name || 'User'}</Text>
                      <Text className="text-charcoal60 text-sm" numberOfLines={1}>{user?.email || 'email@example.com'}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={handleLogout} activeOpacity={0.7} className="self-start mt-2">
                    <Text className="text-clay font-semibold text-sm">Log out</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={{ fontFamily: 'PlayfairDisplay-SemiBold' }} className="text-3xl text-ink mb-2 tracking-tight">
                {isOnboarding ? "What's your style?" : "Style Preferences"}
              </Text>
              <Text className="text-charcoal60 text-sm mb-8">
                Pick a few that feel like you — you can change this anytime.
              </Text>

              {/* Error Banner */}
              {errorMsg ? (
                <View className="bg-clay/10 border border-clay/35 rounded-xl p-4 mb-6">
                  <Text className="text-clay text-sm font-medium">{errorMsg}</Text>
                </View>
              ) : null}

              {/* Style Tags Flex Grid */}
              <View className="flex-row flex-wrap gap-x-2.5 gap-y-3.5 mb-10">
                {styleTags.map((tag, index) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <SwingTag
                      key={index}
                      text={tag}
                      color={isSelected ? 'bg-brass' : 'bg-transparent'}
                      textColor={isSelected ? 'text-bone' : 'text-ink'}
                      notchBg="bg-bone"
                      border={!isSelected}
                      onPress={() => handleToggleTag(tag)}
                      rotation={isSelected ? '-8deg' : '2deg'}
                    />
                  );
                })}
              </View>

              {/* Budget Range Section */}
              <Text className="text-charcoal60 text-xs font-bold uppercase tracking-widest mb-4">
                Usual budget range
              </Text>
              
              <View className="flex-row gap-6 mb-10">
                <View className="flex-1">
                  <Text className="text-charcoal60 text-xs font-medium mb-1">Min Budget (₹)</Text>
                  <View className="relative pb-1">
                    <TextInput
                      onFocus={() => setMinBudgetFocused(true)}
                      onBlur={() => setMinBudgetFocused(false)}
                      className="py-2 text-ink text-3xl font-semibold"
                      style={{ fontFamily: 'PlayfairDisplay-Regular' }}
                      placeholder="1,000"
                      placeholderTextColor="#6B655C"
                      keyboardType="numeric"
                      value={minBudget}
                      onChangeText={setMinBudget}
                      editable={!saving}
                    />
                    <Animated.View style={{ height: 1.5, backgroundColor: minBudgetBorderColor, position: 'absolute', bottom: 0, left: 0, right: 0 }} />
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-charcoal60 text-xs font-medium mb-1">Max Budget (₹)</Text>
                  <View className="relative pb-1">
                    <TextInput
                      onFocus={() => setMaxBudgetFocused(true)}
                      onBlur={() => setMaxBudgetFocused(false)}
                      className="py-2 text-ink text-3xl font-semibold"
                      style={{ fontFamily: 'PlayfairDisplay-Regular' }}
                      placeholder="10,000"
                      placeholderTextColor="#6B655C"
                      keyboardType="numeric"
                      value={maxBudget}
                      onChangeText={setMaxBudget}
                      editable={!saving}
                    />
                    <Animated.View style={{ height: 1.5, backgroundColor: maxBudgetBorderColor, position: 'absolute', bottom: 0, left: 0, right: 0 }} />
                  </View>
                </View>
              </View>
            </View>

            {/* Contextual Action Button */}
            <TouchableOpacity
              className={`w-full py-4 rounded-sm items-center mt-6 shadow-none ${saving ? 'bg-brass/60' : 'bg-brass'}`}
              onPress={handleSave}
              activeOpacity={0.85}
              disabled={saving}
            >
              {saving ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="#F6F1E7" />
                  <Text className="text-bone text-base font-semibold tracking-widest uppercase">Saving...</Text>
                </View>
              ) : (
                <Text className="text-bone text-base font-semibold tracking-widest uppercase">
                  {isOnboarding ? "Save and continue" : "Save changes"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Floating Confirmation Toast */}
      <Animated.View 
        style={{ 
          opacity: toastOpacity,
          position: 'absolute',
          bottom: 40,
          alignSelf: 'center',
          backgroundColor: '#1E1B18',
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 4,
          elevation: 2,
          shadowOpacity: 0.15,
          shadowRadius: 5,
        }}
        pointerEvents="none"
      >
        <Text className="text-bone text-sm font-semibold tracking-wider uppercase">Profile updated</Text>
      </Animated.View>
    </SafeAreaView>
  );
}
