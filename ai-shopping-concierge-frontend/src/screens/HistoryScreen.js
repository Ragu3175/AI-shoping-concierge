import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getHistory, getHistoryDetail } from '../api/queryApi';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.23:8000';

export default function HistoryScreen({ navigation }) {
  const [historyData, setHistoryData] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingCardId, setLoadingCardId] = useState(null);

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
        className="bg-white border border-slate-200 rounded-2xl p-4 mb-3"
        onPress={() => handlePressCard(item)}
        activeOpacity={0.7}
        disabled={isLoadingCard}
      >
        {/* Query & Time */}
        <View className="flex-row justify-between items-start mb-3">
          <Text className="text-slate-800 font-semibold text-base flex-1 mr-4" numberOfLines={2}>
            {item.query_text}
          </Text>
          <View className="flex-row items-center">
            {isLoadingCard ? (
              <ActivityIndicator size="small" color="#4f46e5" />
            ) : (
              <Text className="text-slate-400 text-xs mt-0.5">
                {formatTimeLabel(item.created_at)}
              </Text>
            )}
          </View>
        </View>

        {/* Top Pick Preview Sub-row */}
        <View className="flex-row items-center bg-slate-50 border border-slate-100 rounded-xl p-2.5">
          {topPickImage ? (
            <Image
              source={{ uri: topPickImage }}
              className="w-10 h-10 rounded-lg bg-slate-200 mr-3"
              resizeMode="cover"
            />
          ) : (
            <View className="w-10 h-10 bg-slate-200 rounded-lg justify-center items-center mr-3">
              <Text className="text-slate-400 text-[10px] font-bold">Image</Text>
            </View>
          )}

          <View className="flex-1">
            <Text className="text-slate-400 text-[10px] uppercase tracking-wider font-bold mb-0.5">
              {item.top_pick?.badge || 'Top Pick'}
            </Text>
            <Text className="text-slate-700 text-xs font-medium" numberOfLines={1}>
              {item.top_pick ? item.top_pick.name : 'No recommendations'}
            </Text>
          </View>

          {item.top_pick && (
            <Text className="text-[#4f46e5] text-xs font-bold pl-2">
              {formatPrice(item.top_pick.price)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom', 'left', 'right']}>
      {loadingList && historyData.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={historyData}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
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
      )}
    </SafeAreaView>
  );
}
