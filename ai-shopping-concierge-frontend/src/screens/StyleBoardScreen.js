import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, Animated, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.29.124:8000';

export default function StyleBoardScreen({ route, navigation }) {
  const {
    query = 'Office wear, budget ₹5k, minimal style',
    top_pick = null,
    alternatives = [],
    error = null
  } = route.params || {};

  // Animation ref for fading status line
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return `${API_BASE_URL}${imagePath}`;
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) return '';
    return `₹${price.toLocaleString('en-IN')}`;
  };

  // Render Error View if API call failed
  if (error || (!top_pick && (!alternatives || alternatives.length === 0))) {
    return (
      <SafeAreaView className="flex-1 bg-[#FAF9F6] justify-center px-6" edges={['top', 'bottom', 'left', 'right']}>
        <View className="bg-white border border-stone-200 rounded-3xl p-8 items-center shadow-sm">
          <Text className="text-4xl mb-4">⚠️</Text>
          <Text className="text-xl font-bold text-[#2A2A2A] text-center mb-2">
            Oops!
          </Text>
          <Text className="text-stone-500 text-sm text-center mb-6 leading-5">
            {error || "We couldn't find matches for your search. Try tweaking your query!"}
          </Text>
          <TouchableOpacity
            className="w-full bg-[#4F46E5] py-4 rounded-2xl items-center"
            onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
            activeOpacity={0.85}
          >
            <Text className="text-white font-semibold text-base">Try New Search</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const topPickReasoning = top_pick?.comparator_reasoning || top_pick?.stylist_reasoning || top_pick?.budget_reasoning || 'Top recommendation for your search.';
  const topPickImageUrl = getImageUrl(top_pick?.image_url);

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
              Stylist, budget and comparator agents reviewed your catalog
            </Text>
          </Animated.View>

          {/* Section: Top Pick */}
          <Text className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-3">Top pick</Text>

          {/* Hero Card */}
          <View className="bg-white border-2 border-[#4F46E5] rounded-2xl p-5 mb-8 shadow-sm">
            <View className="flex-row justify-between items-start mb-4">
              {topPickImageUrl ? (
                <Image
                  source={{ uri: topPickImageUrl }}
                  className="w-24 h-24 rounded-xl bg-stone-100"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-24 h-24 bg-stone-100 rounded-xl justify-center items-center">
                  <Text className="text-stone-400 text-xs font-semibold">No Image</Text>
                </View>
              )}
              <View className="bg-[#4F46E5] px-3.5 py-1.5 rounded-full">
                <Text className="text-white text-[10px] font-bold uppercase tracking-wider">
                  {top_pick?.badge || 'Top pick'}
                </Text>
              </View>
            </View>

            <Text className="text-xl font-bold text-[#2A2A2A] mb-1">{top_pick?.name}</Text>
            <Text className="text-lg font-semibold text-[#4F46E5] mb-3">{formatPrice(top_pick?.price)}</Text>
            
            {/* Reasoning text */}
            <View className="border-t border-stone-100 pt-3">
              <Text className="text-stone-600 text-sm leading-5">
                {topPickReasoning}
              </Text>
            </View>
          </View>

          {/* Section: Also Worth A Look */}
          {alternatives && alternatives.length > 0 && (
            <Text className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-3">Also worth a look</Text>
          )}
        </View>

        {/* Horizontal ScrollView of alternatives */}
        {alternatives && alternatives.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 24, paddingRight: 24 }}
            className="mb-8"
          >
            {alternatives.map((card, index) => {
              const badgeText = card.badge || 'Style match';
              const isBestValue = badgeText === "Best value";
              const badgeBg = isBestValue ? "bg-teal-50" : "bg-indigo-50";
              const badgeTxt = isBestValue ? "text-teal-700" : "text-[#4F46E5]";
              const badgeBorder = isBestValue ? "border-teal-200" : "border-indigo-100";
              const cardImageUrl = getImageUrl(card.image_url);
              const cardReasoning = card.comparator_reasoning || card.stylist_reasoning || card.budget_reasoning || 'Solid alternative match for your search.';

              return (
                <View key={card.id || index} className="bg-white border border-stone-200 rounded-2xl p-4 mr-4 w-64 shadow-xs">
                  <View className="flex-row justify-between items-start mb-3">
                    {cardImageUrl ? (
                      <Image
                        source={{ uri: cardImageUrl }}
                        className="w-16 h-16 rounded-xl bg-stone-100"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-16 h-16 bg-stone-100 rounded-xl justify-center items-center">
                        <Text className="text-stone-400 text-[10px] font-semibold">No Image</Text>
                      </View>
                    )}
                    <View className={`${badgeBg} ${badgeBorder} border px-2.5 py-1 rounded-full`}>
                      <Text className={`${badgeTxt} text-[10px] font-bold uppercase tracking-wider`}>
                        {badgeText}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-base font-bold text-[#2A2A2A] mb-1" numberOfLines={1}>
                    {card.name}
                  </Text>
                  <Text className="text-sm font-semibold text-[#4F46E5] mb-2">{formatPrice(card.price)}</Text>

                  <Text className="text-stone-500 text-xs leading-4" numberOfLines={3}>
                    {cardReasoning}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Back navigation */}
        <View className="px-6 mt-4">
          <TouchableOpacity 
            className="w-full border border-stone-300 py-4 rounded-2xl items-center bg-white"
            onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
            activeOpacity={0.7}
          >
            <Text className="text-stone-700 font-semibold text-base">New Search</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
