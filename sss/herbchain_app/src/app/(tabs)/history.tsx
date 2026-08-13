import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Type, Spacing, BorderRadius } from '@/theme';
import { AppHeader } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { SearchBar, FilterChips, EmptyState } from '@/components/CardsAndInputs';
import { useProductStore } from '@/store/productStore';
import { getProductById } from '@/data/mockProducts';

export default function HistoryScreen() {
  const router = useRouter();
  const { scanHistory, isSaved, toggleSaved } = useProductStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  const filterOptions = ['All', 'Verified', 'Warning', 'Recalled', 'Expired'];

  const filteredHistory = scanHistory.filter((item) => {
    const product = getProductById(item.productId);
    if (!product) return false;

    // Search query match
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      product.name.toLowerCase().includes(q) ||
      product.manufacturer.toLowerCase().includes(q) ||
      product.batchId.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    // Filter chip match
    if (selectedFilter === 'All') return true;
    return product.status.toLowerCase() === selectedFilter.toLowerCase();
  });

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Scan History" />

      <View style={styles.content}>
        <Text style={styles.pageTitle}>Scan History</Text>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search history by name or batch..."
        />

        <FilterChips
          options={filterOptions}
          selected={selectedFilter}
          onSelect={setSelectedFilter}
        />

        {filteredHistory.length === 0 ? (
          <EmptyState
            title="No scans found"
            description={
              scanHistory.length === 0
                ? 'Scan your first Ayurvedic product to discover its complete journey.'
                : 'No scan history items match your current filter or search criteria.'
            }
            actionText={scanHistory.length === 0 ? 'Scan Product Now' : undefined}
            onAction={() => router.push('/(tabs)/scan')}
          />
        ) : (
          <FlatList
            data={filteredHistory}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const product = getProductById(item.productId);
              if (!product) return null;
              return (
                <View style={styles.historyItemWrapper}>
                  {item.statusUpdated && (
                    <View style={styles.updatedBanner}>
                      <Text style={styles.updatedText}>
                        ⚠️ Status Updated: Issued recall after original scan
                      </Text>
                    </View>
                  )}
                  <ProductCard
                    product={product}
                    isBookmarked={isSaved(product.id)}
                    onBookmarkPress={() => toggleSaved(product.id)}
                    onPress={() => router.push(`/verify/${product.batchId}` as any)}
                  />
                </View>
              );
            }}
            contentContainerStyle={{ paddingBottom: Spacing['2xl'] }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.sm,
  },
  pageTitle: {
    ...Type.headlineLgMobile,
    color: Colors.primary,
    marginBottom: Spacing.base,
  },
  historyItemWrapper: {
    marginBottom: Spacing.xs,
  },
  updatedBanner: {
    backgroundColor: Colors.tertiaryFixed,
    paddingHorizontal: Spacing.base,
    paddingVertical: 6,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    marginBottom: -8,
    zIndex: 1,
  },
  updatedText: {
    fontFamily: Fonts.family.semiBold,
    fontSize: 12,
    color: Colors.onTertiaryFixedVariant,
  },
});
