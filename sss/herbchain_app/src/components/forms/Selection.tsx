import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Fonts, Type, Spacing, BorderRadius } from '@/theme';
import Icon from '../Icon';

/* ─────────────────────────  Option group (single choice)  ───────────────────────── */

export interface Option<T extends string = string> {
  value: T;
  label: string;
}

interface OptionGroupProps<T extends string> {
  label: string;
  options: Option<T>[];
  value: T | '';
  onSelect: (v: T) => void;
  error?: string;
}

export function OptionGroup<T extends string>({
  label,
  options,
  value,
  onSelect,
  error,
}: OptionGroupProps<T>) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionCol}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.optionRow, active && styles.optionRowActive]}
              onPress={() => onSelect(opt.value)}
              activeOpacity={0.75}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              <View style={[styles.radio, active && styles.radioActive]}>
                {active && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

/* ─────────────────────────  Chip multi-select  ───────────────────────── */

interface ChipMultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  hint?: string;
}

export const ChipMultiSelect: React.FC<ChipMultiSelectProps> = ({
  label,
  options,
  selected,
  onToggle,
  hint,
}) => {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <View style={styles.chipWrap}>
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <TouchableOpacity
              key={opt}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onToggle(opt)}
              activeOpacity={0.75}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
            >
              {active && <Icon name="checkmark" size={13} color={Colors.onSecondaryContainer} />}
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

/* ─────────────────────────  Consent checkbox  ───────────────────────── */

interface ConsentCheckboxProps {
  label: string;
  description?: string;
  checked: boolean;
  onToggle: () => void;
  required?: boolean;
  error?: boolean;
}

export const ConsentCheckbox: React.FC<ConsentCheckboxProps> = ({
  label,
  description,
  checked,
  onToggle,
  required,
  error,
}) => {
  return (
    <TouchableOpacity
      style={[styles.consentRow, error && styles.consentRowError]}
      onPress={onToggle}
      activeOpacity={0.75}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Icon name="checkmark" size={15} color={Colors.onPrimary} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.consentLabel}>
          {label}
          {required ? <Text style={styles.requiredStar}> *</Text> : <Text style={styles.optionalTag}>  Optional</Text>}
        </Text>
        {description ? <Text style={styles.consentDesc}>{description}</Text> : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  group: { marginBottom: Spacing.lg },
  label: { ...Type.labelMd, color: Colors.onSurface, marginBottom: Spacing.md },
  hint: { ...Type.bodySm, color: Colors.outline, marginTop: -Spacing.sm, marginBottom: Spacing.md },
  optionCol: { gap: Spacing.sm },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  optionRowActive: { borderColor: Colors.secondary, backgroundColor: Colors.secondaryContainer },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: Colors.onSecondaryContainer },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.onSecondaryContainer },
  optionLabel: { ...Type.bodyMd, color: Colors.onSurface, flex: 1 },
  optionLabelActive: { color: Colors.onSecondaryContainer, fontFamily: Fonts.family.medium },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.base,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  chipActive: { borderColor: Colors.secondary, backgroundColor: Colors.secondaryContainer },
  chipText: { ...Type.bodySm, color: Colors.onSurfaceVariant },
  chipTextActive: { color: Colors.onSecondaryContainer, fontFamily: Fonts.family.semiBold },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  consentRowError: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.error,
    paddingHorizontal: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm + 2,
    borderWidth: 2,
    borderColor: Colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: Colors.primaryContainer, borderColor: Colors.primaryContainer },
  consentLabel: { ...Type.bodyMd, color: Colors.onSurface },
  requiredStar: { color: Colors.error },
  optionalTag: { ...Type.bodySm, color: Colors.outline },
  consentDesc: { ...Type.bodySm, color: Colors.onSurfaceVariant, marginTop: 2 },
  errorText: { ...Type.bodySm, color: Colors.error, marginTop: Spacing.sm },
});
