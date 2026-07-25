import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, Animated, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SwingTag from '../components/SwingTag';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.23:8000';

export default function StyleBoardScreen({ route, navigation }) {
  const {
    query = 'Office wear, budget ₹5k, minimal style',
    top_pick = null,
    alternatives = [],
    error = null
  } = route.params || {};

  // Animation ref for fading status line
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Header dynamic configuration
  useEffect(() => {
    navigation.setOptions({
      title: 'Style Board',
    });
  }, [navigation]);

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
      <SafeAreaView className="flex-1 bg-bone justify-center px-6" edges={['top', 'bottom', 'left', 'right']}>
        <View className="bg-white border border-[#EADFC9] rounded-xl p-8 items-center shadow-xs">
          <Text className="text-4xl mb-4">⚠️</Text>
          <Text className="text-xl font-bold text-ink text-center mb-2">
            Oops!
          </Text>
          <Text className="text-charcoal60 text-sm text-center mb-6 leading-5">
            {error || "We couldn't find matches for your search. Try tweaking your query!"}
          </Text>
          <TouchableOpacity
            className="w-full bg-brass py-4 rounded-sm items-center"
            onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
            activeOpacity={0.85}
          >
            <Text className="text-bone font-semibold text-sm tracking-widest uppercase">Try New Search</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const topPickReasoning = top_pick?.comparator_reasoning || top_pick?.stylist_reasoning || top_pick?.budget_reasoning || 'Top recommendation for your search.';
  const topPickImageUrl = getImageUrl(top_pick?.image_url);

  return (
    <SafeAreaView className="flex-1 bg-bone" edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* Top Header/Pill Section */}
        <View className="px-6 pt-4">
          <View className="bg-white border border-[#EADFC9] self-start px-4 py-2 rounded-sm mb-4">
            <Text className="text-charcoal60 text-xs font-semibold">🔍 {query}</Text>
          </View>

          {/* Fading Status Line */}
          <Animated.View style={{ opacity: fadeAnim }} className="flex-row items-center mb-6">
            <Text className="text-sage text-base font-bold mr-2">✓</Text>
            <Text className="text-charcoal60 text-xs font-medium">
              Stylist, budget and comparator agents reviewed your catalog
            </Text>
          </Animated.View>

          {/* Section: Top Pick */}
          <Text className="text-charcoal60 text-xs font-bold uppercase tracking-widest mb-3">Top pick</Text>

          {/* Hero Card */}
          <View className="bg-white border border-[#EADFC9] rounded-xl overflow-hidden mb-8 shadow-xs">
            {/* Full-bleed image with Price Badge absolute-positioned */}
            <View className="relative w-full h-64 bg-bone justify-center items-center">
              {topPickImageUrl ? (
                <Image
                  source={{ uri: topPickImageUrl }}
                  style={{ width: 192, height: 256 }}
                  resizeMode="cover"
                  fadeDuration={0}
                  resizeMethod="resize"
                />
              ) : (
                <View className="w-full h-full justify-center items-center">
                  <Text className="text-charcoal60 text-sm font-semibold">No Image Available</Text>
                </View>
              )}
              {/* Absolute price swing-tag badge */}
              <View className="absolute top-4 right-4 shadow-sm">
                <SwingTag text={formatPrice(top_pick?.price)} color="bg-brass" textColor="text-bone" notchBg="bg-white" rotation="-8deg" />
              </View>
            </View>

            <View className="p-5">
              <Text style={{ fontFamily: 'PlayfairDisplay-SemiBold' }} className="text-2xl font-bold text-ink mb-3 leading-8">
                {top_pick?.name}
              </Text>

              {/* Reasoning tags */}
              <View className="flex-row flex-wrap gap-2 mb-4">
                {top_pick?.stylist_reasoning && (
                  <SwingTag text="style match" color="bg-brass" textColor="text-bone" notchBg="bg-white" rotation="-8deg" small={true} />
                )}
                {top_pick?.budget_reasoning && (
                  <SwingTag text="within budget" color="bg-sage" textColor="text-bone" notchBg="bg-white" rotation="-8deg" small={true} />
                )}
                {top_pick?.comparator_reasoning && (
                  <SwingTag text="value pick" color="bg-clay" textColor="text-bone" notchBg="bg-white" rotation="-8deg" small={true} />
                )}
              </View>

              {/* Detailed Reasoning text */}
              <View className="border-t border-[#F6F1E7] pt-4">
                <Text className="text-charcoal60 text-sm leading-6">
                  {topPickReasoning}
                </Text>
              </View>
            </View>
          </View>

          {/* Section: Also Worth A Look */}
          {alternatives && alternatives.length > 0 && (
            <Text className="text-charcoal60 text-xs font-bold uppercase tracking-widest mb-3">Also worth a look</Text>
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
              const cardImageUrl = getImageUrl(card.image_url);
              const cardReasoning = card.comparator_reasoning || card.stylist_reasoning || card.budget_reasoning || 'Solid alternative match for your search.';

              return (
                <View key={card.id || index} className="bg-white border border-[#EADFC9] rounded-xl overflow-hidden mr-4 w-64 shadow-xs">
                  {/* Full-bleed image with Price Badge absolute-positioned */}
                  <View className="relative w-full h-40 bg-bone justify-center items-center">
                    {cardImageUrl ? (
                      <Image
                        source={{ uri: cardImageUrl }}
                        style={{ width: 120, height: 160 }}
                        resizeMode="cover"
                        fadeDuration={0}
                        resizeMethod="resize"
                      />
                    ) : (
                      <View className="w-full h-full justify-center items-center">
                        <Text className="text-charcoal60 text-xs font-semibold">No Image</Text>
                      </View>
                    )}
                    {/* Absolute price swing-tag badge */}
                    <View className="absolute top-3 right-3 shadow-xs">
                      <SwingTag text={formatPrice(card.price)} color="bg-brass" textColor="text-bone" notchBg="bg-white" rotation="-8deg" small={true} />
                    </View>
                  </View>

                  <View className="p-4">
                    <Text 
                      style={{ fontFamily: 'PlayfairDisplay-SemiBold' }} 
                      className="text-base font-bold text-ink mb-2" 
                      numberOfLines={1}
                    >
                      {card.name}
                    </Text>

                    {/* Reasoning tags */}
                    <View className="flex-row flex-wrap gap-1.5 mb-3">
                      {card?.stylist_reasoning && (
                        <SwingTag text="style match" color="bg-brass" textColor="text-bone" notchBg="bg-white" rotation="-8deg" small={true} />
                      )}
                      {card?.budget_reasoning && (
                        <SwingTag text="on budget" color="bg-sage" textColor="text-bone" notchBg="bg-white" rotation="-8deg" small={true} />
                      )}
                      {card?.comparator_reasoning && (
                        <SwingTag text="value pick" color="bg-clay" textColor="text-bone" notchBg="bg-white" rotation="-8deg" small={true} />
                      )}
                    </View>

                    <Text className="text-charcoal60 text-xs leading-5" numberOfLines={3}>
                      {cardReasoning}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Back navigation */}
        <View className="px-6 mt-4">
          <TouchableOpacity 
            className="w-full border border-[#B08D57] py-4 rounded-sm items-center bg-white"
            onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
            activeOpacity={0.7}
          >
            <Text className="text-brass font-semibold tracking-widest uppercase text-sm">New Search</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
