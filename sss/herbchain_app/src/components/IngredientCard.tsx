import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Ingredient } from '@/types';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '@/theme';
import { StatusBadge } from './Badges';
import Icon from './Icon';

interface IngredientCardProps {
  ingredient: Ingredient;
  onPress?: () => void;
}

export const IngredientCard: React.FC<IngredientCardProps> = ({ ingredient, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.card, Shadow.sm]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}
    >
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Icon name="flower-outline" size={22} color={Colors.primary} />
        </View>

        <View style={styles.titleCol}>
          <Text style={styles.commonName}>{ingredient.commonName}</Text>
          <Text style={styles.latinName}>{ingredient.scientificName}</Text>
        </View>

        <StatusBadge status={ingredient.status} size="sm" />
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Plant Part</Text>
          <Text style={styles.detailVal}>{ingredient.plantPart}</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Source Region</Text>
          <Text style={styles.detailVal}>{ingredient.sourceRegion}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm + 2,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm + 2,
  },
  titleCol: {
    flex: 1,
  },
  commonName: {
    fontFamily: Fonts.family.bold,
    fontWeight: Fonts.weight.bold,
    fontSize: Fonts.size.base,
    color: Colors.text,
  },
  latinName: {
    fontFamily: Fonts.family.medium,
    fontWeight: Fonts.weight.medium,
    fontSize: Fonts.size.xs + 1,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm + 2,
    marginTop: 4,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
  },
  detailVal: {
    fontFamily: Fonts.family.semiBold,
    fontWeight: Fonts.weight.semiBold,
    fontSize: Fonts.size.xs + 1,
    color: Colors.text,
    marginTop: 2,
  },
});
