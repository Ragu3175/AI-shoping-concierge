import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

export default function SuggestionChip({ label, onPress }) {
  return (
    <TouchableOpacity 
      className="bg-slate-100 hover:bg-slate-200 border border-slate-300 px-4 py-2 rounded-full m-1"
      onPress={onPress}
    >
      <Text className="text-slate-700 text-sm font-semibold">{label || 'Suggestion'}</Text>
    </TouchableOpacity>
  );
}
