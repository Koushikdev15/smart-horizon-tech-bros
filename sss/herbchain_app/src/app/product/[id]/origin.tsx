import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '@/theme';
import { AppHeader } from '@/components/Header';
import Icon from '@/components/Icon';
import { getProductById, PRODUCTS } from '@/data/mockProducts';

export default function OriginScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const product = getProductById(id || '') || PRODUCTS[0];
  const { origin } = product;

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showBack onBackPress={() => router.back()} title="Where Did It Come From?" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Map Visualization Container */}
        <View style={[styles.mapContainer, Shadow.md]}>
          <View style={styles.mapGraphic}>
            <View style={styles.mapPulseRing} />
            <View style={styles.mapPin}>
              <Icon name="location" size={28} color={Colors.white} />
            </View>
            <Text style={styles.mapRegionTag}>📍 {origin.sourceRegion}, {origin.district}</Text>
          </View>
          <Text style={styles.mapNote}>
            Region-level geographic verification. Private farm coordinates are protected for farmer privacy.
          </Text>
        </View>

        {/* Origin Region Spec Card */}
        <View style={[styles.card, Shadow.sm]}>
          <Text style={styles.cardTitle}>Origin Region Details</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Source Region</Text>
            <Text style={styles.val}>{origin.sourceRegion}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>District</Text>
            <Text style={styles.val}>{origin.district}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>State</Text>
            <Text style={styles.val}>{origin.state}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Country</Text>
            <Text style={styles.val}>{origin.country}</Text>
          </View>
        </View>

        {/* Harvest Verification Note */}
        <View style={[styles.card, Shadow.sm]}>
          <View style={styles.iconTitleRow}>
            <Icon name="shield-checkmark" size={20} color={Colors.success} />
            <Text style={styles.cardTitle}>Geo-Fenced Source Verification</Text>
          </View>
          <Text style={styles.descText}>
            The raw herbal materials in this batch were collected within the officially registered and ecologically audited harvesting zone of {origin.district}, {origin.state}.
          </Text>
        </View>
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
  mapContainer: {
    backgroundColor: Colors.darkGreen,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  mapGraphic: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.gold + '40',
  },
  mapPulseRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.lightGreen + '30',
  },
  mapPin: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  mapRegionTag: {
    position: 'absolute',
    bottom: 12,
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.xs + 1,
    color: Colors.primary,
  },
  mapNote: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs,
    color: Colors.lightGreen,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 16,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  cardTitle: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.base,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  label: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs + 1,
    color: Colors.textMuted,
  },
  val: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.xs + 1,
    color: Colors.text,
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  descText: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs + 1,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: 4,
  },
});
