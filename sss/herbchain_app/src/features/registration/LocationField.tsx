import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { Colors, Type, Spacing, BorderRadius } from '@/theme';
import Icon from '@/components/Icon';

type PermissionState = 'idle' | 'requesting' | 'granted' | 'denied' | 'error';

interface ExactLocationFieldProps {
  value?: { latitude: number; longitude: number };
  onChange: (coords: { latitude: number; longitude: number } | undefined) => void;
}

export const ExactLocationField: React.FC<ExactLocationFieldProps> = ({ value, onChange }) => {
  const [state, setState] = useState<PermissionState>(value ? 'granted' : 'idle');
  const [message, setMessage] = useState<string | null>(null);

  async function useCurrentLocation() {
    setState('requesting');
    setMessage(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState('denied');
        setMessage('Location permission denied. You can still continue — this field is optional.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      onChange({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      setState('granted');
    } catch {
      setState('error');
      setMessage("Couldn't get your location. Please try again.");
    }
  }

  return (
    <View style={styles.group}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Exact Location</Text>
        <Text style={styles.optional}>Optional</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, state === 'granted' && styles.buttonGranted]}
        onPress={useCurrentLocation}
        disabled={state === 'requesting'}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel="Use current location"
      >
        {state === 'requesting' ? (
          <ActivityIndicator size="small" color={Colors.primaryContainer} />
        ) : (
          <Icon
            name={state === 'granted' ? 'checkmark-circle' : 'location'}
            size={20}
            color={state === 'granted' ? Colors.onSecondaryContainer : Colors.primaryContainer}
          />
        )}
        <Text style={[styles.buttonText, state === 'granted' && styles.buttonTextGranted]}>
          {state === 'requesting'
            ? 'Getting your location…'
            : state === 'granted'
              ? 'Location captured'
              : 'Use Current Location'}
        </Text>
      </TouchableOpacity>

      {value && state === 'granted' ? (
        <View style={styles.coordRow}>
          <Text style={styles.coordText}>
            {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
          </Text>
          <TouchableOpacity
            onPress={() => {
              onChange(undefined);
              setState('idle');
            }}
            hitSlop={10}
          >
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {message ? (
        <View style={styles.messageRow}>
          <Icon
            name={state === 'denied' ? 'information-circle' : 'alert-circle'}
            size={13}
            color={state === 'denied' ? Colors.outline : Colors.error}
          />
          <Text style={[styles.messageText, state !== 'denied' && { color: Colors.error }]}>
            {message}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  group: { marginBottom: Spacing.base },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  label: { ...Type.labelMd, color: Colors.onSurface },
  optional: { ...Type.bodySm, color: Colors.outline },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: 54,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.primaryContainer,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  buttonGranted: {
    borderStyle: 'solid',
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondaryContainer,
  },
  buttonText: { ...Type.labelMd, color: Colors.primaryContainer },
  buttonTextGranted: { color: Colors.onSecondaryContainer },
  coordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  coordText: { ...Type.bodySm, color: Colors.onSurfaceVariant },
  clearText: { ...Type.bodySm, color: Colors.error },
  messageRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: Spacing.sm },
  messageText: { ...Type.bodySm, color: Colors.outline, flex: 1 },
});

export default ExactLocationField;
