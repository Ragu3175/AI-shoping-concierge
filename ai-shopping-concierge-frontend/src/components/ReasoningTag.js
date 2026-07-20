import React from 'react';
import { View, Text } from 'react-native';

export default function ReasoningTag({ text }) {
  return (
    <View className="bg-amber-50 border border-amber-200 px-3 py-1 rounded-full self-start my-1">
      <Text className="text-amber-800 text-xs font-medium">💡 {text || 'AI Reasoning'}</Text>
    </View>
  );
}
