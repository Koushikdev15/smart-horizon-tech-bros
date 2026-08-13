import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Type, Spacing, BorderRadius } from '@/theme';
import Icon from '../Icon';

interface StepProgressProps {
  steps: string[];
  current: number; // zero-based
}

export const StepProgress: React.FC<StepProgressProps> = ({ steps, current }) => {
  return (
    <View style={styles.wrap}>
      <View style={styles.railRow}>
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <React.Fragment key={label}>
              <View style={styles.nodeCol}>
                <View style={[styles.node, done && styles.nodeDone, active && styles.nodeActive]}>
                  {done ? (
                    <Icon name="checkmark" size={13} color={Colors.onPrimary} />
                  ) : (
                    <Text style={[styles.nodeNum, active && styles.nodeNumActive]}>{i + 1}</Text>
                  )}
                </View>
              </View>
              {i < steps.length - 1 && <View style={[styles.connector, done && styles.connectorDone]} />}
            </React.Fragment>
          );
        })}
      </View>

      <View style={styles.labelRow}>
        <Text style={styles.stepCount}>
          Step {current + 1} of {steps.length}
        </Text>
        <Text style={styles.stepName}>{steps[current]}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: Spacing.lg },
  railRow: { flexDirection: 'row', alignItems: 'center' },
  nodeCol: { alignItems: 'center' },
  node: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeDone: { backgroundColor: Colors.primaryContainer, borderColor: Colors.primaryContainer },
  nodeActive: { borderColor: Colors.onTertiaryContainer, borderWidth: 2, backgroundColor: Colors.surface },
  nodeNum: { fontFamily: Fonts.family.semiBold, fontSize: 12, color: Colors.outline },
  nodeNumActive: { color: Colors.primary },
  connector: { flex: 1, height: 2, backgroundColor: Colors.outlineVariant, marginHorizontal: 4 },
  connectorDone: { backgroundColor: Colors.primaryContainer },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  stepCount: { ...Type.labelCaps, color: Colors.outline },
  stepName: { ...Type.labelMd, color: Colors.primary },
});

export default StepProgress;
