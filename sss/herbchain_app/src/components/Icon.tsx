import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { ColorValue } from 'react-native';
import { Colors } from '@/theme';

export type IconName = keyof typeof Ionicons.glyphMap;

interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorValue;
  style?: any;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = Colors.text,
  style,
}) => {
  return <Ionicons name={name} size={size} color={color} style={style} />;
};

export default Icon;
