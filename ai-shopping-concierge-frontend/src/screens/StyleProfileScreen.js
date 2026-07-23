import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Animated, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../context/AuthContext';
import { getProfile, updateProfile, uploadProfilePicture } from '../api/profileApi';

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
    <SafeAreaView className="flex-1 bg-[#FAF9F6]" edges={['bottom', 'left', 'right']}>
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text className="text-stone-500 mt-2">Loading preferences...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View className="px-6 py-6 flex-1 justify-between">
            <View>
              {/* Account Details Panel (Visible only when viewed inside persistent Profile Tab) */}
              {!isOnboarding && (
                <View className="bg-white border border-stone-200 rounded-2xl p-5 mb-8">
                  <Text className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-3">
                    Account Details
                  </Text>
                  <View className="flex-row items-center gap-4 mb-4">
                    <TouchableOpacity onPress={handlePickImage} activeOpacity={0.7} className="relative">
                      {user?.profile_picture_url ? (
                        <Image 
                          source={{ uri: getProfilePictureUrl(user.profile_picture_url) }} 
                          className="w-16 h-16 rounded-full bg-stone-100 border border-stone-200" 
                        />
                      ) : (
                        <View className="w-16 h-16 rounded-full bg-[#4F46E5] justify-center items-center">
                          <Text className="text-white text-xl font-bold">
                            {(user?.name || 'U').substring(0, 1).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View className="absolute bottom-0 right-0 bg-white border border-stone-200 rounded-full p-1 shadow-sm">
                        <Text className="text-[10px]">📸</Text>
                      </View>
                    </TouchableOpacity>
                    
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-[#2A2A2A]">{user?.name || 'User'}</Text>
                      <Text className="text-stone-500 text-sm" numberOfLines={1}>{user?.email || 'email@example.com'}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={handleLogout} activeOpacity={0.7} className="self-start">
                    <Text className="text-red-500 font-semibold text-sm">Log out</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text className="text-3xl font-bold text-[#2A2A2A] mb-2 tracking-tight">
                {isOnboarding ? "What's your style?" : "Style Preferences"}
              </Text>
              <Text className="text-stone-500 text-base mb-8">
                Pick a few that feel like you — you can change this anytime.
              </Text>

              {/* Error Banner */}
              {errorMsg ? (
                <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                  <Text className="text-red-600 text-sm font-medium">{errorMsg}</Text>
                </View>
              ) : null}

              {/* Style Tags Flex Grid */}
              <View className="flex-row flex-wrap gap-3 mb-10">
                {styleTags.map((tag, index) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={index}
                      className={`px-5 py-3 rounded-full border ${
                        isSelected 
                          ? 'bg-[#4F46E5] border-[#4F46E5]' 
                          : 'bg-white border-stone-200'
                      }`}
                      onPress={() => handleToggleTag(tag)}
                      activeOpacity={0.7}
                      disabled={saving}
                    >
                      <Text className={`text-sm font-semibold ${
                        isSelected ? 'text-white' : 'text-stone-600'
                      }`}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Budget Range Section */}
              <Text className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-4">
                Usual budget range
              </Text>
              
              <View className="flex-row gap-4 mb-10">
                <View className="flex-1">
                  <Text className="text-stone-500 text-xs font-medium mb-2">Min Budget (₹)</Text>
                  <TextInput
                    className="bg-white border border-stone-200 rounded-xl p-4 text-[#2A2A2A] text-base"
                    placeholder="₹1,000"
                    placeholderTextColor="#8C8C8C"
                    keyboardType="numeric"
                    value={minBudget}
                    onChangeText={setMinBudget}
                    editable={!saving}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-stone-500 text-xs font-medium mb-2">Max Budget (₹)</Text>
                  <TextInput
                    className="bg-white border border-stone-200 rounded-xl p-4 text-[#2A2A2A] text-base"
                    placeholder="₹10,000"
                    placeholderTextColor="#8C8C8C"
                    keyboardType="numeric"
                    value={maxBudget}
                    onChangeText={setMaxBudget}
                    editable={!saving}
                  />
                </View>
              </View>
            </View>

            {/* Contextual Action Button */}
            <TouchableOpacity
              className={`w-full py-4 rounded-2xl items-center mt-6 ${saving ? 'bg-slate-400' : 'bg-[#4F46E5]'}`}
              onPress={handleSave}
              activeOpacity={0.85}
              disabled={saving}
            >
              {saving ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text className="text-white text-base font-semibold tracking-wide">Saving...</Text>
                </View>
              ) : (
                <Text className="text-white text-base font-semibold tracking-wide">
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
          bottom: 120,
          alignSelf: 'center',
          backgroundColor: '#1e293b',
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 9999,
          elevation: 2,
          shadowOpacity: 0.15,
          shadowRadius: 5,
        }}
        pointerEvents="none"
      >
        <Text className="text-white text-sm font-semibold">Profile updated</Text>
      </Animated.View>
    </SafeAreaView>
  );
}
