import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HistoryScreen({ navigation }) {
  const historyData = [
    { id: '1', query: 'Office wear, budget ₹5k, minimal style', time: '2 days ago', topPick: { name: 'Tailored cotton shirt, slate grey', price: '₹2,899' } },
    { id: '2', query: 'Gift for a football fan, under ₹2k', time: '5 days ago', topPick: { name: 'Real Madrid away jersey', price: '₹1,799' } },
    { id: '3', query: 'Casual weekend outfit', time: '1 week ago', topPick: { name: 'Relaxed fit hoodie, charcoal', price: '₹1,499' } }
  ];

  const handlePressCard = (query) => {
    navigation.navigate('StyleBoard', { query });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      className="bg-white border border-slate-200 rounded-2xl p-4 mb-3"
      onPress={() => handlePressCard(item.query)}
      activeOpacity={0.7}
    >
      {/* Query & Time */}
      <View className="flex-row justify-between items-start mb-3">
        <Text className="text-slate-800 font-semibold text-base flex-1 mr-4" numberOfLines={2}>
          {item.query}
        </Text>
        <Text className="text-slate-400 text-xs mt-0.5">{item.time}</Text>
      </View>

      {/* Top Pick Preview Sub-row */}
      <View className="flex-row items-center bg-slate-50 border border-slate-100 rounded-xl p-2.5">
        {/* Small thumbnail placeholder */}
        <View className="w-10 h-10 bg-slate-200 rounded-lg justify-center items-center mr-3">
          <Text className="text-slate-400 text-[10px] font-bold">Image</Text>
        </View>
        <View className="flex-1">
          <Text className="text-slate-400 text-[10px] uppercase tracking-wider font-bold mb-0.5">Top Pick</Text>
          <Text className="text-slate-700 text-xs font-medium" numberOfLines={1}>
            {item.topPick.name}
          </Text>
        </View>
        <Text className="text-[#4f46e5] text-xs font-bold pl-2">{item.topPick.price}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom', 'left', 'right']}>
      <FlatList
        data={historyData}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 }}
        ListHeaderComponent={
          <Text className="text-2xl font-bold text-slate-800 mb-6 tracking-tight">
            Your past searches
          </Text>
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-slate-400 text-sm text-center">
              No searches yet — try asking for something on the Home tab.
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
