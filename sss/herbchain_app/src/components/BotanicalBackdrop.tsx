import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/theme';
import Icon, { IconName } from './Icon';

/**
 * Faint medicinal-leaf motifs (tulsi / neem / amla / ashwagandha) drifting around
 * the screen edges. Purely decorative: rendered behind content, non-interactive,
 * and hidden from screen readers.
 */
interface Leaf {
  icon: IconName;
  size: number;
  top?: number | string;
  bottom?: number | string;
  left?: number | string;
  right?: number | string;
  rotate: string;
  opacity: number;
  color: string;
}

const LEAVES: Leaf[] = [
  { icon: 'leaf', size: 132, top: -28, right: -34, rotate: '24deg', opacity: 0.07, color: Colors.primaryContainer },
  { icon: 'leaf-outline', size: 96, top: '22%', left: -34, rotate: '-38deg', opacity: 0.06, color: Colors.sage },
  { icon: 'leaf', size: 78, top: '52%', right: -22, rotate: '128deg', opacity: 0.05, color: Colors.secondary },
  { icon: 'leaf-outline', size: 148, bottom: -44, left: -40, rotate: '62deg', opacity: 0.06, color: Colors.primaryContainer },
  { icon: 'leaf', size: 88, bottom: '14%', right: -26, rotate: '-16deg', opacity: 0.05, color: Colors.sage },
];

export const BotanicalBackdrop: React.FC = () => {
  return (
    <View style={styles.wrap} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {LEAVES.map((leaf, i) => (
        <View
          key={i}
          style={[
            styles.leaf,
            {
              top: leaf.top as any,
              bottom: leaf.bottom as any,
              left: leaf.left as any,
              right: leaf.right as any,
              opacity: leaf.opacity,
              transform: [{ rotate: leaf.rotate }],
            },
          ]}
        >
          <Icon name={leaf.icon} size={leaf.size} color={leaf.color} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  leaf: {
    position: 'absolute',
  },
});

export default BotanicalBackdrop;
