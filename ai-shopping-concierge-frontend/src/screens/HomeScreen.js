import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SuggestionChip from '../components/SuggestionChip';

export default function HomeScreen({ navigation }) {
  const [query, setQuery] = useState('');

  const suggestionChips = [
    "Office wear", 
    "Gift idea", 
    "Under ₹2k", 
    "Casual weekend"
  ];

  // Hide Screen Header dynamically to let the custom masthead shine
  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Focus and Border Animations
  const [queryFocused, setQueryFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(borderAnim, {
      toValue: queryFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [queryFocused]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(107, 101, 92, 0.2)', '#B08D57'],
  });

  const handleSubmit = () => {
    if (query.trim() === '') return;
    navigation.navigate('Loading', { query: query.trim() });
  };

  return (
    <SafeAreaView className="flex-1 bg-bone px-6 justify-center" edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
        <View className="py-12">
          {/* Masthead Headline */}
          <Text 
            style={{ fontFamily: 'PlayfairDisplay-SemiBold' }} 
            className="text-4xl font-bold text-ink text-left mb-12 tracking-tight leading-[48px]"
          >
            What are you{"\n"}shopping for?
          </Text>

          {/* Understated Multiline TextInput with Animated bottom-border */}
          <View className="relative mb-10 pb-1">
            <TextInput
              onFocus={() => setQueryFocused(true)}
              onBlur={() => setQueryFocused(false)}
              className="w-full text-ink text-lg py-3 font-normal align-top leading-6"
              style={{ minHeight: 80, textAlignVertical: 'top' }}
              placeholder="Office wear, budget ₹5k, minimal style..."
              placeholderTextColor="#6B655C"
              multiline={true}
              numberOfLines={3}
              value={query}
              onChangeText={setQuery}
            />
            <Animated.View style={{ height: 1.5, backgroundColor: borderColor, position: 'absolute', bottom: 0, left: 0, right: 0 }} />
          </View>

          {/* Suggestion Chips with horizontal scroll */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 4, paddingVertical: 12, gap: 8 }}
            className="mb-10"
          >
            {suggestionChips.map((chip, index) => (
              <SuggestionChip
                key={index}
                label={chip}
                onPress={() => setQuery(chip)}
                isActive={query === chip}
              />
            ))}
          </ScrollView>

          {/* Submit Button */}
          <TouchableOpacity
            className="w-full bg-brass py-4 rounded-sm items-center shadow-none"
            onPress={handleSubmit}
            activeOpacity={0.85}
          >
            <Text className="text-bone text-base font-semibold tracking-widest uppercase">Find my picks</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
