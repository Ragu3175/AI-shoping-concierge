import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Animated, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { runQuery } from '../api/queryApi';

export default function LoadingScreen({ route, navigation }) {
  const query = route.params?.query || '';
  const [msgIndex, setMsgIndex] = useState(0);

  const messages = [
    { text: "Reading your request...", label: "Parser Agent" },
    { text: "Digging through your closet-worth of options...", label: "Catalog Searcher" },
    { text: "Matching your style, not your search history...", label: "Style Expert" },
    { text: "Making sure your wallet survives this...", label: "Budget Advisor" },
    { text: "Comparing notes with the other agents...", label: "Coordinator Agent" },
    { text: "Almost got your picks...", label: "Finalizer" }
  ];

  const textOpacity = useRef(new Animated.Value(1)).current;
  const shimmerValue = useRef(new Animated.Value(0)).current;

  // Infinite looping shimmer animation
  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmerValue]);

  // Message cycling interval
  useEffect(() => {
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep = (currentStep + 1) % messages.length;
      Animated.timing(textOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setMsgIndex(currentStep);
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Background API call + minimum 3-second display timing
  useEffect(() => {
    let isMounted = true;
    const startTime = Date.now();
    const MIN_DISPLAY_MS = 3000;

    const fetchPicks = async () => {
      try {
        const responseData = await runQuery(query);
        if (!isMounted) return;

        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

        setTimeout(() => {
          if (isMounted) {
            navigation.replace('StyleBoard', {
              query,
              top_pick: responseData?.top_pick,
              alternatives: responseData?.alternatives || [],
              intent: responseData?.intent || {},
              broadened: responseData?.broadened || false,
              error: null
            });
          }
        }, remaining);
      } catch (err) {
        console.error('Error running shopping query:', err);
        if (!isMounted) return;

        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

        setTimeout(() => {
          if (isMounted) {
            navigation.replace('StyleBoard', {
              query,
              error: "Something went wrong finding your picks. Try again?"
            });
          }
        }, remaining);
      }
    };

    if (query) {
      fetchPicks();
    }

    return () => {
      isMounted = false;
    };
  }, [query]);

  // Reusable Skeleton Component with sweeping shimmer highlight
  const SkeletonBox = ({ width, height, className }) => {
    const translateX = shimmerValue.interpolate({
      inputRange: [0, 1],
      outputRange: [-150, 300],
    });

    return (
      <View 
        style={{ width, height, overflow: 'hidden', backgroundColor: '#E2E8F0' }}
        className={`${className || 'rounded-xl'}`}
      >
        <Animated.View
          style={{
            width: 100,
            height: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.65)',
            position: 'absolute',
            transform: [
              { translateX },
              { skewX: '-20deg' }
            ]
          }}
        />
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* Status Message Text Section */}
        <View className="px-6 pt-8 pb-4 items-center min-h-[120px] justify-center mb-10">
          <Animated.View style={{ opacity: textOpacity }} className="items-center w-full">
            <Text className="text-xs uppercase tracking-widest text-indigo-400 font-bold mb-1.5">
              {messages[msgIndex].label}
            </Text>
            <Text className="text-base font-medium text-slate-700 text-center px-4 leading-5">
              {messages[msgIndex].text}
            </Text>
          </Animated.View>
        </View>

        {/* Shimmering Skeleton Elements */}
        <View className="px-6">
          <View style={{ backgroundColor: '#E2E8F0' }} className="w-16 h-3 rounded mb-3" />

          <View className="bg-white border border-stone-200 rounded-2xl p-5 mb-8">
            <View className="flex-row justify-between items-start mb-4">
              <SkeletonBox width={96} height={96} className="rounded-xl" />
              <SkeletonBox width={70} height={24} className="rounded-full" />
            </View>

            <SkeletonBox width="80%" height={20} className="rounded mb-2" />
            <SkeletonBox width="35%" height={16} className="rounded mb-4" />

            <View className="border-t border-stone-100 pt-4 gap-2">
              <SkeletonBox width="100%" height={12} className="rounded" />
              <SkeletonBox width="90%" height={12} className="rounded" />
            </View>
          </View>

          <View style={{ backgroundColor: '#E2E8F0' }} className="w-28 h-3 rounded mb-3" />
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 24, paddingRight: 24 }}
          className="flex-row mb-6"
        >
          {[1, 2, 3].map((_, index) => (
            <View key={index} className="bg-white border border-stone-200 rounded-2xl p-4 mr-4 w-64">
              <View className="flex-row justify-between items-start mb-3">
                <SkeletonBox width={64} height={64} className="rounded-xl" />
                <SkeletonBox width={65} height={20} className="rounded-full" />
              </View>

              <SkeletonBox width="80%" height={16} className="rounded mb-2" />
              <SkeletonBox width="40%" height={12} className="rounded mb-3" />

              <SkeletonBox width="100%" height={10} className="rounded mb-1.5" />
              <SkeletonBox width="70%" height={10} className="rounded" />
            </View>
          ))}
        </ScrollView>

      </ScrollView>
    </SafeAreaView>
  );
}
