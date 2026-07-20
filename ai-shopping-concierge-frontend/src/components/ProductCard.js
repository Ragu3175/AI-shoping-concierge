import React from 'react';
import { View, Text } from 'react-native';

export default function ProductCard({ title, price, description }) {
  return (
    <View className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm my-2">
      <Text className="text-lg font-bold text-slate-800">{title || 'Product Title'}</Text>
      {price && <Text className="text-blue-600 font-semibold mt-1">{price}</Text>}
      {description && <Text className="text-slate-500 text-sm mt-1">{description}</Text>}
    </View>
  );
}
