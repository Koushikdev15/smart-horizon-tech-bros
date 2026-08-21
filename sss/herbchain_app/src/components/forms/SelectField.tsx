import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Pressable } from 'react-native';
import { Colors, Type, Spacing, BorderRadius, Shadow } from '@/theme';
import Icon, { IconName } from '../Icon';

interface SelectFieldProps {
  label: string;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
  placeholder?: string;
  icon?: IconName;
  error?: string;
  optional?: boolean;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select an option',
  icon,
  error,
  optional,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.group}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {optional && <Text style={styles.optional}>Optional</Text>}
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.trigger, !!error && styles.triggerError]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${label}. ${value || placeholder}`}
      >
        {icon && <Icon name={icon} size={19} color={Colors.outline} style={styles.icon} />}
        <Text style={[styles.triggerText, !value && styles.triggerPlaceholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Icon name="chevron-down" size={18} color={Colors.outline} />
      </TouchableOpacity>

      {error ? (
        <View style={styles.errorRow}>
          <Icon name="alert-circle" size={13} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{label}</Text>
            <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
              {options.map((opt) => {
                const active = opt === value;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => {
                      onSelect(opt);
                      setOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>{opt}</Text>
                    {active && <Icon name="checkmark" size={18} color={Colors.onSecondaryContainer} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  group: { marginBottom: Spacing.base },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  label: { ...Type.labelMd, color: Colors.onSurface },
  optional: { ...Type.bodySm, color: Colors.outline },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  triggerError: { borderColor: Colors.error },
  icon: { marginRight: Spacing.md },
  triggerText: { flex: 1, ...Type.bodyMd, color: Colors.onSurface },
  triggerPlaceholder: { color: Colors.outline },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: Spacing.sm },
  errorText: { ...Type.bodySm, color: Colors.error, flex: 1 },
  backdrop: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    maxHeight: '70%',
    ...Shadow.lg,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
    marginBottom: Spacing.base,
  },
  sheetTitle: { ...Type.headlineSm, color: Colors.primary, marginBottom: Spacing.md },
  sheetScroll: { flexGrow: 0 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.lg,
  },
  optionActive: { backgroundColor: Colors.secondaryContainer },
  optionText: { ...Type.bodyMd, color: Colors.onSurface },
  optionTextActive: { color: Colors.onSecondaryContainer, fontFamily: Type.labelMd.fontFamily },
});

export default SelectField;
