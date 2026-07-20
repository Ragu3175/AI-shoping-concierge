// TODO: Replace dummy data with real POST /api/query response once AI pipeline (LangGraph + CrewAI) is implemented in backend/
import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, Animated, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StyleBoardScreen({ route, navigation }) {
  const query = route.params?.query || 'Office wear, budget ₹5k, minimal style';
  
  // Animation ref for fade-in status
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const alternativeCards = [
    { name: "Linen blend shirt", price: "₹1,999", badge: "Best value", reasoning: "Great quality for the price point." },
    { name: "Structured blazer", price: "₹4,499", badge: "Style match", reasoning: "Elevates the minimal look for meetings." },
    { name: "Slim chinos, charcoal", price: "₹1,599", badge: "Style match", reasoning: "Pairs cleanly with the shirt above." }
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#FAF9F6]" edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* Top Header/Pill Section */}
        <View className="px-6 pt-4">
          <View className="bg-stone-100 border border-stone-200 self-start px-4 py-2 rounded-full mb-4">
            <Text className="text-stone-600 text-sm font-medium">🔍 {query}</Text>
          </View>

          {/* Fading Status Line */}
          <Animated.View style={{ opacity: fadeAnim }} className="flex-row items-center mb-6">
            <Text className="text-emerald-600 text-base font-bold mr-2">✓</Text>
            <Text className="text-stone-500 text-sm font-medium">
              Stylist, budget and comparator agents reviewed 340 items
            </Text>
          </Animated.View>

          {/* Section: Top Pick */}
          <Text className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-3">Top pick</Text>

          {/* Hero Card */}
          <View className="bg-white border-2 border-[#4F46E5] rounded-2xl p-5 mb-8">
            <View className="flex-row justify-between items-start mb-4">
              {/* Placeholder image box */}
              <View className="w-24 h-24 bg-stone-100 rounded-xl justify-center items-center">
                <Text className="text-stone-400 text-xs font-semibold">Image</Text>
              </View>
              <View className="bg-[#4F46E5] px-3.5 py-1.5 rounded-full">
                <Text className="text-white text-[10px] font-bold uppercase tracking-wider">Top pick</Text>
              </View>
            </View>

            <Text className="text-xl font-bold text-[#2A2A2A] mb-1">Tailored cotton shirt, slate grey</Text>
            <Text className="text-lg font-semibold text-[#4F46E5] mb-3">₹2,899</Text>
            
            {/* Reasoning text */}
            <View className="border-t border-stone-100 pt-3">
              <Text className="text-stone-600 text-sm leading-5">
                Matches your minimal aesthetic and leaves headroom in your ₹5k budget for a second piece.
              </Text>
            </View>
          </View>

          {/* Section: Also Worth A Look */}
          <Text className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-3">Also worth a look</Text>
        </View>

        {/* Horizontal ScrollView of alternatives */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 24, paddingRight: 24 }}
          className="mb-8"
        >
          {alternativeCards.map((card, index) => {
            // Determine badge colors based on badge type
            const isBestValue = card.badge === "Best value";
            const badgeBg = isBestValue ? "bg-teal-50" : "bg-indigo-50";
            const badgeTxt = isBestValue ? "text-teal-700" : "text-[#4F46E5]";
            const badgeBorder = isBestValue ? "border-teal-200" : "border-indigo-100";

            return (
              <View key={index} className="bg-white border border-stone-200 rounded-2xl p-4 mr-4 w-64">
                <View className="flex-row justify-between items-start mb-3">
                  {/* Placeholder image box */}
                  <View className="w-16 h-16 bg-stone-100 rounded-xl justify-center items-center">
                    <Text className="text-stone-400 text-[10px] font-semibold">Image</Text>
                  </View>
                  <View className={`${badgeBg} ${badgeBorder} border px-2.5 py-1 rounded-full`}>
                    <Text className={`${badgeTxt} text-[10px] font-bold uppercase tracking-wider`}>
                      {card.badge}
                    </Text>
                  </View>
                </View>

                <Text className="text-base font-bold text-[#2A2A2A] mb-1" numberOfLines={1}>
                  {card.name}
                </Text>
                <Text className="text-sm font-semibold text-[#4F46E5] mb-2">{card.price}</Text>

                <Text className="text-stone-500 text-xs leading-4" numberOfLines={2}>
                  {card.reasoning}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Back navigation */}
        <View className="px-6 mt-4">
          <TouchableOpacity 
            className="w-full border border-stone-300 py-4 rounded-2xl items-center"
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text className="text-stone-700 font-semibold text-base">New Search</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
