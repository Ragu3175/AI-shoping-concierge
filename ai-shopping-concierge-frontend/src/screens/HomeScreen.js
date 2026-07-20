import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen({ navigation }) {
  const [query, setQuery] = useState('');

  const suggestionChips = [
    "Office wear", 
    "Gift idea", 
    "Under ₹2k", 
    "Casual weekend"
  ];

  const handleSubmit = () => {
    if (query.trim() === '') return;
    navigation.navigate('Loading', { query: query.trim() });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAF9F6] px-6 justify-center" edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
        <View className="py-6">
          <Text className="text-3xl font-bold text-[#2A2A2A] text-center mb-8 tracking-tight leading-10">
            What are you{"\n"}looking for?
          </Text>

          {/* Multiline TextInput */}
          <TextInput
            className="w-full bg-white border border-stone-200 rounded-2xl p-5 text-[#2A2A2A] text-base mb-6 align-top"
            style={{ minHeight: 120, textAlignVertical: 'top' }}
            placeholder="Office wear, budget ₹5k, minimal style..."
            placeholderTextColor="#8C8C8C"
            multiline={true}
            numberOfLines={4}
            value={query}
            onChangeText={setQuery}
          />

          {/* Suggestion Chips */}
          <View className="flex-row flex-wrap justify-center gap-2 mb-8">
            {suggestionChips.map((chip, index) => (
              <TouchableOpacity
                key={index}
                className="bg-stone-100 border border-stone-200 px-4 py-2.5 rounded-full"
                onPress={() => setQuery(chip)}
                activeOpacity={0.7}
              >
                <Text className="text-stone-700 text-sm font-medium">{chip}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            className="w-full bg-[#4F46E5] py-4 rounded-2xl items-center shadow-none border border-transparent"
            onPress={handleSubmit}
            activeOpacity={0.85}
          >
            <Text className="text-white text-base font-semibold tracking-wide">Find my picks</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
