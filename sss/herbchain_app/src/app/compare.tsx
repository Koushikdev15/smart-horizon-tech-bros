import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '@/theme';
import { AppHeader } from '@/components/Header';
import { TrustScore } from '@/components/Badges';
import Icon from '@/components/Icon';
import { PRODUCTS } from '@/data/mockProducts';
import type { Product } from '@/types';

export default function CompareScreen() {
  const router = useRouter();

  // Pre-select first 2 products for side-by-side comparison
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([
    PRODUCTS[0],
    PRODUCTS[1],
  ]);

  const addProductToCompare = (product: Product) => {
    if (selectedProducts.find((p) => p.id === product.id)) return;
    if (selectedProducts.length >= 3) {
      alert('You can compare up to 3 products at a time.');
      return;
    }
    setSelectedProducts([...selectedProducts, product]);
  };

  const removeProduct = (id: string) => {
    if (selectedProducts.length <= 1) {
      alert('Keep at least 1 product to compare.');
      return;
    }
    setSelectedProducts(selectedProducts.filter((p) => p.id !== id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showBack onBackPress={() => router.back()} title="Product Comparison" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Helper Banner */}
        <View style={styles.banner}>
          <Icon name="information-circle-outline" size={18} color={Colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.bannerText}>
            Compares source authenticity, lab results, and traceability records. Does not compare medical effectiveness.
          </Text>
        </View>

        {/* Selected Product Headers Side by Side */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.compareScrollView}>
          <View>
            <View style={styles.row}>
              <View style={styles.labelCol}>
                <Text style={styles.rowHeaderLabel}>Product Info</Text>
              </View>
              {selectedProducts.map((p) => (
                <View key={p.id} style={styles.itemCol}>
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeProduct(p.id)}>
                    <Icon name="close-circle" size={18} color={Colors.error} />
                  </TouchableOpacity>
                  <Text style={styles.prodName} numberOfLines={2}>{p.name}</Text>
                  <Text style={styles.prodMfr} numberOfLines={1}>{p.manufacturer}</Text>
                  <TrustScore score={p.trustScore} size="sm" showLabel />
                </View>
              ))}

              {selectedProducts.length < 3 && (
                <TouchableOpacity
                  style={[styles.itemCol, styles.addCol]}
                  onPress={() => {
                    const remaining = PRODUCTS.find((p) => !selectedProducts.find((sp) => sp.id === p.id));
                    if (remaining) addProductToCompare(remaining);
                  }}
                >
                  <Icon name="add-circle-outline" size={28} color={Colors.primary} />
                  <Text style={styles.addText}>Add Product</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Comparison Metrics */}
            <View style={styles.metricSection}>
              <Text style={styles.metricCategory}>Authenticity & Trust</Text>

              <View style={styles.row}>
                <View style={styles.labelCol}><Text style={styles.metricLabel}>Trust Score</Text></View>
                {selectedProducts.map((p) => (
                  <View key={p.id} style={styles.itemCol}>
                    <Text style={styles.valBold}>{p.trustScore}%</Text>
                  </View>
                ))}
              </View>

              <View style={styles.row}>
                <View style={styles.labelCol}><Text style={styles.metricLabel}>Source Verified</Text></View>
                {selectedProducts.map((p) => (
                  <View key={p.id} style={styles.itemCol}>
                    <Icon name={p.quickVerification.sourceVerified ? 'checkmark-circle' : 'close-circle'} size={18} color={p.quickVerification.sourceVerified ? Colors.success : Colors.error} />
                  </View>
                ))}
              </View>

              <View style={styles.row}>
                <View style={styles.labelCol}><Text style={styles.metricLabel}>Lab Verified</Text></View>
                {selectedProducts.map((p) => (
                  <View key={p.id} style={styles.itemCol}>
                    <Icon name={p.quickVerification.labVerified ? 'checkmark-circle' : 'close-circle'} size={18} color={p.quickVerification.labVerified ? Colors.success : Colors.error} />
                  </View>
                ))}
              </View>

              <View style={styles.row}>
                <View style={styles.labelCol}><Text style={styles.metricLabel}>Blockchain Record</Text></View>
                {selectedProducts.map((p) => (
                  <View key={p.id} style={styles.itemCol}>
                    <Icon name={p.quickVerification.blockchainAvailable ? 'checkmark-circle' : 'close-circle'} size={18} color={p.quickVerification.blockchainAvailable ? Colors.success : Colors.error} />
                  </View>
                ))}
              </View>

              <Text style={styles.metricCategory}>Traceability & Sustainability</Text>

              <View style={styles.row}>
                <View style={styles.labelCol}><Text style={styles.metricLabel}>Source Region</Text></View>
                {selectedProducts.map((p) => (
                  <View key={p.id} style={styles.itemCol}>
                    <Text style={styles.valText}>{p.origin.sourceRegion}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.row}>
                <View style={styles.labelCol}><Text style={styles.metricLabel}>Sustainability</Text></View>
                {selectedProducts.map((p) => (
                  <View key={p.id} style={styles.itemCol}>
                    <Text style={styles.valBold}>{p.sustainability.score} / 100</Text>
                  </View>
                ))}
              </View>

              <View style={styles.row}>
                <View style={styles.labelCol}><Text style={styles.metricLabel}>Expiry Date</Text></View>
                {selectedProducts.map((p) => (
                  <View key={p.id} style={styles.itemCol}>
                    <Text style={styles.valText}>{p.expiryDate}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
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
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGreen,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginVertical: Spacing.md,
  },
  bannerText: {
    flex: 1,
    fontFamily: Fonts.family.regular,
    fontSize: 11,
    color: Colors.primary,
    lineHeight: 15,
  },
  compareScrollView: {
    marginVertical: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  labelCol: {
    width: 130,
    paddingRight: 8,
  },
  rowHeaderLabel: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.xs + 1,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  itemCol: {
    width: 130,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    position: 'relative',
  },
  addCol: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    paddingVertical: Spacing.lg,
  },
  addText: {
    fontFamily: Fonts.family.semiBold,
    fontSize: Fonts.size.xs,
    color: Colors.primary,
    marginTop: 4,
  },
  removeBtn: {
    position: 'absolute',
    top: -4,
    right: 4,
    zIndex: 1,
  },
  prodName: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.xs + 1,
    color: Colors.text,
    textAlign: 'center',
    height: 32,
  },
  prodMfr: {
    fontFamily: Fonts.family.regular,
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 6,
  },
  metricSection: {
    marginTop: Spacing.md,
  },
  metricCategory: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.sm,
    color: Colors.primary,
    marginTop: Spacing.md,
    marginBottom: 4,
  },
  metricLabel: {
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.size.xs,
    color: Colors.textSecondary,
  },
  valBold: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.xs + 1,
    color: Colors.text,
  },
  valText: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs,
    color: Colors.text,
    textAlign: 'center',
  },
});
