import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  type KeyboardTypeOptions,
} from 'react-native';
import { Colors, Fonts, Type, Spacing, BorderRadius } from '@/theme';
import Icon, { IconName } from '../Icon';

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  icon?: IconName;
  error?: string;
  hint?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
  multiline?: boolean;
  optional?: boolean;
  /** Password-style field with a visibility toggle. */
  password?: boolean;
  /** Government ID / sensitive value: masked by default, shows a secure indicator. */
  secure?: boolean;
  onBlur?: () => void;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  error,
  hint,
  keyboardType,
  autoCapitalize = 'sentences',
  maxLength,
  multiline,
  optional,
  password,
  secure,
  onBlur,
}) => {
  const masked = Boolean(password || secure);
  const [hidden, setHidden] = useState(masked);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.group}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {optional && <Text style={styles.optional}>Optional</Text>}
        {secure && (
          <View style={styles.secureTag}>
            <Icon name="lock-closed" size={10} color={Colors.onSecondaryContainer} />
            <Text style={styles.secureTagText}>Encrypted</Text>
          </View>
        )}
      </View>

      <View
        style={[
          styles.inputWrap,
          multiline && styles.inputWrapMultiline,
          focused && styles.inputWrapFocused,
          !!error && styles.inputWrapError,
        ]}
      >
        {icon && <Icon name={icon} size={19} color={focused ? Colors.secondary : Colors.outline} style={styles.icon} />}
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.outline}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          multiline={multiline}
          secureTextEntry={masked && hidden}
          onFocus={() => {
            console.log('[DIAG] focus', label, Date.now());
            setFocused(true);
          }}
          onBlur={() => {
            console.log('[DIAG] blur', label, Date.now());
            setFocused(false);
            onBlur?.();
          }}
          accessibilityLabel={label}
        />
        {masked && (
          <TouchableOpacity
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? `Show ${label}` : `Hide ${label}`}
          >
            <Icon name={hidden ? 'eye-outline' : 'eye-off-outline'} size={19} color={Colors.outline} />
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Icon name="alert-circle" size={13} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  group: { marginBottom: Spacing.base },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  label: { ...Type.labelMd, color: Colors.onSurface },
  optional: { ...Type.bodySm, color: Colors.outline },
  secureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  secureTagText: { fontFamily: Fonts.family.semiBold, fontSize: 10, color: Colors.onSecondaryContainer },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  inputWrapMultiline: { minHeight: 110, alignItems: 'flex-start', paddingVertical: Spacing.md },
  // Focus resolves to Deep Forest border per the design system.
  inputWrapFocused: {
    borderColor: Colors.primaryContainer,
  },
  inputWrapError: { borderColor: Colors.error },
  icon: { marginRight: Spacing.md },
  input: { flex: 1, ...Type.bodyMd, color: Colors.onSurface, paddingVertical: Spacing.md },
  inputMultiline: { textAlignVertical: 'top', paddingTop: 0 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: Spacing.sm },
  errorText: { ...Type.bodySm, color: Colors.error, flex: 1 },
  hint: { ...Type.bodySm, color: Colors.outline, marginTop: Spacing.sm },
});

export default FormField;
