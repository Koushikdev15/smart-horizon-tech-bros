import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '@/theme';
import { AppHeader } from '@/components/Header';
import { IngredientCard } from '@/components/IngredientCard';
import Icon from '@/components/Icon';
import { getProductById, PRODUCTS } from '@/data/mockProducts';
import type { Ingredient } from '@/types';

export default function IngredientsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const product = getProductById(id || '') || PRODUCTS[0];
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(
    product.ingredients[0] || null
  );

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        showBack
        onBackPress={() => router.back()}
        title="What's Inside?"
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeader}>Botanical Ingredients ({product.ingredients.length})</Text>

        {product.ingredients.map((ing) => (
          <IngredientCard
            key={ing.id}
            ingredient={ing}
            onPress={() => setSelectedIngredient(ing)}
          />
        ))}

        {/* Selected Ingredient Deep Dive Detail Card */}
        {selectedIngredient && (
          <View style={[styles.detailCard, Shadow.md]}>
            <View style={styles.detailHeader}>
              <Icon name="leaf" size={24} color={Colors.primary} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.detailName}>{selectedIngredient.commonName}</Text>
                <Text style={styles.detailLatin}>{selectedIngredient.scientificName}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoGrid}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Plant Part</Text>
                <Text style={styles.infoVal}>{selectedIngredient.plantPart}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Source Region</Text>
                <Text style={styles.infoVal}>{selectedIngredient.sourceRegion}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Harvest Date</Text>
                <Text style={styles.infoVal}>{selectedIngredient.harvestDate}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Quality Grade</Text>
                <Text style={styles.infoVal}>{selectedIngredient.quality}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Processing</Text>
                <Text style={styles.infoVal}>{selectedIngredient.processing}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Sustainability</Text>
                <Text style={styles.infoVal}>{selectedIngredient.sustainabilityStatus}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.aboutTitle}>About This Ingredient</Text>
            <Text style={styles.aboutText}>{selectedIngredient.about}</Text>
            <Text style={styles.botanicalDisclaimer}>
              Botanical educational information only. Unsupported medical claims are not made.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing['2xl'],
  },
  sectionHeader: {
    fontFamily: Fonts.family.serifSemiBold,
    fontSize: Fonts.size.lg,
    color: Colors.text,
    marginVertical: Spacing.md,
  },
  detailCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailName: {
    fontFamily: Fonts.family.serifSemiBold,
    fontSize: Fonts.size.lg,
    color: Colors.text,
  },
  detailLatin: {
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.size.xs + 1,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.md,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: Spacing.md,
  },
  infoCol: {
    width: '50%',
  },
  infoLabel: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
  },
  infoVal: {
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.size.xs + 1,
    color: Colors.text,
    marginTop: 2,
  },
  aboutTitle: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.sm + 1,
    color: Colors.text,
    marginBottom: 6,
  },
  aboutText: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs + 1,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  botanicalDisclaimer: {
    fontFamily: Fonts.family.regular,
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: Spacing.md,
    fontStyle: 'italic',
  },
});
