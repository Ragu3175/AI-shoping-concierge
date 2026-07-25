import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function SwingTag({ 
  text, 
  color = 'bg-brass', 
  textColor = 'text-bone', 
  rotation = '-8deg', 
  style, 
  notchBg = 'bg-bone', 
  onPress,
  border = false,
  small = false
}) {
  const Container = onPress ? TouchableOpacity : View;
  
  return (
    <Container 
      onPress={onPress}
      activeOpacity={onPress ? 0.85 : 1}
      className={`${color} ${small ? 'px-2 py-1' : 'px-3 py-1.5'} rounded-sm relative flex-row items-center justify-center ${border ? 'border border-bone' : ''}`}
      style={[{ transform: [{ rotate: rotation }] }, style]}
    >
      {/* Die-cut notch */}
      <View className={`absolute ${small ? 'left-1 w-1.5 h-1.5' : 'left-2 w-2 h-2'} rounded-full ${notchBg}`} />
      
      {/* Text label */}
      <Text className={`${textColor} ${small ? 'text-[9px] pl-2.5' : 'text-xs pl-4'} font-semibold uppercase tracking-widest`}>
        {text}
      </Text>
    </Container>
  );
}
