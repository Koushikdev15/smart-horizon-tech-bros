import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { LabResult, TimelineEvent } from '@/types';
import { Colors, Fonts, Type, Spacing, BorderRadius, Shadow } from '@/theme';
import Icon, { IconName } from './Icon';

interface LabResultCardProps {
  result: LabResult;
  onPress?: () => void;
}

export const LabResultCard: React.FC<LabResultCardProps> = ({ result, onPress }) => {
  const [expanded, setExpanded] = useState(false);
  const isPassed = result.status === 'passed';

  return (
    <TouchableOpacity
      style={[styles.labCard, Shadow.sm]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.85}
    >
      <View style={styles.labHeader}>
        <View
          style={[
            styles.statusIcon,
            { backgroundColor: isPassed ? Colors.lightGreen : Colors.errorContainer },
          ]}
        >
          <Icon
            name={isPassed ? 'checkmark-circle' : 'alert-circle'}
            size={18}
            color={isPassed ? Colors.success : Colors.error}
          />
        </View>

        <View style={styles.labTitleCol}>
          <Text style={styles.labTestName}>{result.test}</Text>
          <Text style={styles.labSubText}>{result.laboratory}</Text>
        </View>

        <View style={styles.resultBadge}>
          <Text
            style={[
              styles.resultText,
              { color: isPassed ? Colors.success : Colors.error },
            ]}
          >
            {result.result}
          </Text>
        </View>
      </View>

      {expanded && (
        <View style={styles.labExpanded}>
          <View style={styles.labGrid}>
            {result.unit && (
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Unit</Text>
                <Text style={styles.gridVal}>{result.unit}</Text>
              </View>
            )}
            {result.referenceRange && (
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Reference Range</Text>
                <Text style={styles.gridVal}>{result.referenceRange}</Text>
              </View>
            )}
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Date</Text>
              <Text style={styles.gridVal}>{result.date}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Ref ID</Text>
              <Text style={styles.gridVal}>{result.reportReference}</Text>
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

interface TimelineProps {
  events: TimelineEvent[];
}

export const Timeline: React.FC<TimelineProps> = ({ events }) => {
  const getIconName = (icon: string): IconName => {
    switch (icon) {
      case 'leaf':
        return 'leaf-outline';
      case 'warehouse':
        return 'business-outline';
      case 'factory':
        return 'construct-outline';
      case 'flask':
        return 'flask-outline';
      case 'package':
        return 'cube-outline';
      case 'truck':
        return 'bus-outline';
      default:
        return 'checkmark-circle-outline';
    }
  };

  return (
    <View style={styles.timelineContainer}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        return (
          <View key={event.id} style={styles.itemRow}>
            {/* Timeline Line & Node */}
            <View style={styles.leftCol}>
              <View style={styles.nodeCircle}>
                <Icon name={getIconName(event.icon)} size={16} color={Colors.primary} />
              </View>
              {!isLast && <View style={styles.timelineLine} />}
            </View>

            {/* Event Content */}
            <View style={styles.contentCol}>
              <View style={styles.eventHeader}>
                <Text style={styles.stageTitle}>{event.stage}</Text>
                <Text style={styles.eventDate}>{event.date}</Text>
              </View>
              <Text style={styles.locationText}>📍 {event.location}</Text>
              {event.details && <Text style={styles.detailsText}>{event.details}</Text>}
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>✓ {event.status}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  labCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  labHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm + 2,
  },
  labTitleCol: {
    flex: 1,
  },
  labTestName: {
    ...Type.labelMd,
    fontSize: 15,
    color: Colors.onSurface,
  },
  labSubText: {
    ...Type.bodySm,
    color: Colors.outline,
  },
  resultBadge: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  resultText: {
    fontFamily: Fonts.family.semiBold,
    fontSize: 12,
  },
  labExpanded: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
  },
  labGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '50%',
    marginBottom: 8,
  },
  gridLabel: {
    ...Type.labelCaps,
    fontSize: 11,
    color: Colors.outline,
  },
  gridVal: {
    ...Type.labelMd,
    color: Colors.onSurface,
    marginTop: 2,
  },
  // Provenance timeline: sage rail with dark "nodes" marking each custody step.
  timelineContainer: {
    paddingVertical: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  leftCol: {
    alignItems: 'center',
    marginRight: Spacing.base,
    width: 36,
  },
  nodeCircle: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryContainer,
    borderWidth: 3,
    borderColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.secondaryFixedDim,
    marginTop: Spacing.xs,
  },
  contentCol: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.base,
    ...Shadow.sm,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  // Stage names carry the serif — they are the narrative of the journey.
  stageTitle: {
    ...Type.headlineSm,
    color: Colors.primary,
  },
  eventDate: {
    ...Type.bodySm,
    color: Colors.outline,
  },
  locationText: {
    ...Type.labelMd,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.xs,
  },
  detailsText: {
    ...Type.bodySm,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.sm,
  },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusPillText: {
    ...Type.labelCaps,
    fontSize: 11,
    color: Colors.onSecondaryContainer,
  },
});
