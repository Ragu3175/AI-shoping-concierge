import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getHistory, getHistoryDetail } from '../api/queryApi';
import SwingTag from '../components/SwingTag';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.23:8000';

export default function HistoryScreen({ navigation }) {
  const [historyData, setHistoryData] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingCardId, setLoadingCardId] = useState(null);

  // Header dynamic configuration
  useEffect(() => {
    navigation.setOptions({
      title: 'History',
    });
  }, [navigation]);

  const fetchHistory = async () => {
    try {
      setLoadingList(true);
      const data = await getHistory();
      setHistoryData(data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  const handlePressCard = async (item) => {
    if (loadingCardId) return;
    try {
      setLoadingCardId(item.id);
      const detail = await getHistoryDetail(item.id);
      navigation.navigate('StyleBoard', {
        query: detail.query_text || item.query_text,
        top_pick: detail.top_pick,
        alternatives: detail.alternatives || [],
        intent: detail.intent || {},
        broadened: detail.broadened || false,
        error: null,
      });
    } catch (err) {
      console.error('Error fetching history detail:', err);
    } finally {
      setLoadingCardId(null);
    }
  };

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

  const formatTimeLabel = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  const renderItem = ({ item }) => {
    const topPickImage = getImageUrl(item.top_pick?.image_url);
    const isLoadingCard = loadingCardId === item.id;

    return (
      <TouchableOpacity
        className="py-6 border-b border-[#E5DFC6]"
        onPress={() => handlePressCard(item)}
        activeOpacity={0.7}
        disabled={isLoadingCard}
      >
        {/* Query & Time */}
        <View className="flex-row justify-between items-start">
          <Text className="text-ink font-medium text-base flex-1 mr-4" numberOfLines={2}>
            {item.query_text}
          </Text>
          <View className="flex-row items-center">
            {isLoadingCard ? (
              <ActivityIndicator size="small" color="#B08D57" />
            ) : (
              <Text className="text-charcoal60 text-xs mt-0.5 font-medium">
                {formatTimeLabel(item.created_at)}
              </Text>
            )}
          </View>
        </View>

        {/* Top Pick Preview Sub-row */}
        <View className="flex-row items-center bg-white border border-[#EADFC9] rounded-xl p-3 mt-4">
          {topPickImage ? (
            <Image
              source={{ uri: topPickImage }}
              style={{ width: 48, height: 48 }}
              className="rounded-lg bg-bone mr-3"
              resizeMode="cover"
              fadeDuration={0}
              resizeMethod="resize"
            />
          ) : (
            <View className="w-12 h-12 bg-bone rounded-lg justify-center items-center mr-3 border border-[#EADFC9]">
              <Text className="text-charcoal60 text-[9px] font-bold">Image</Text>
            </View>
          )}

          <View className="flex-1">
            <Text className="text-brass text-[9px] uppercase tracking-widest font-bold mb-0.5">
              {item.top_pick?.badge || 'Top Pick'}
            </Text>
            <Text className="text-ink text-sm font-semibold" numberOfLines={1}>
              {item.top_pick ? item.top_pick.name : 'No recommendations'}
            </Text>
          </View>

          {item.top_pick && (
            <View className="pl-3 shadow-xs">
              <SwingTag 
                text={formatPrice(item.top_pick.price)} 
                color="bg-brass" 
                textColor="text-bone" 
                notchBg="bg-white" 
                rotation="-8deg" 
                small={true} 
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-bone" edges={['bottom', 'left', 'right']}>
      {loadingList && historyData.length === 0 ? (
        <View className="flex-1 items-center justify-center bg-bone">
          <ActivityIndicator size="large" color="#B08D57" />
        </View>
      ) : (
        <FlatList
          data={historyData}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 }}
          ListHeaderComponent={
            <Text style={{ fontFamily: 'PlayfairDisplay-SemiBold' }} className="text-3xl font-bold text-ink mb-6 tracking-tight">
              Your past searches
            </Text>
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-charcoal60 text-sm text-center">
                No searches yet — try asking for something on the Home tab.
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
