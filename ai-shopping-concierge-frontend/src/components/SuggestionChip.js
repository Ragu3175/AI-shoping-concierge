import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function SuggestionChip({ label, onPress, isActive }) {
  return (
    <TouchableOpacity 
      className={`px-4 py-2 rounded-sm relative flex-row items-center border border-ink m-1 ${isActive ? 'bg-brass' : 'bg-bone'}`}
      onPress={onPress}
      activeOpacity={0.85}
      style={{ transform: [{ rotate: '2deg' }] }}
    >
      {/* Die-cut notch */}
      <View className="absolute left-1.5 w-1.5 h-1.5 rounded-full bg-[#F6F1E7]" />
      
      <Text className={`text-sm font-semibold uppercase tracking-wider pl-3 ${isActive ? 'text-bone' : 'text-ink'}`}>
        {label || 'Suggestion'}
      </Text>
    </TouchableOpacity>
  );
}
