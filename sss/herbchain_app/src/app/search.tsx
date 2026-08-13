import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing } from '@/theme';
import { AppHeader } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { SearchBar, EmptyState } from '@/components/CardsAndInputs';
import { searchProducts, PRODUCTS } from '@/data/mockProducts';
import { useProductStore } from '@/store/productStore';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { isSaved, toggleSaved } = useProductStore();

  const results = query.trim() ? searchProducts(query) : PRODUCTS;

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showBack onBackPress={() => router.back()} title="Product Search" />

      <View style={styles.content}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search by product name, manufacturer, batch, herb..."
        />

        <Text style={styles.resultsHeader}>
          {query ? `Search Results (${results.length})` : 'All Verified Products'}
        </Text>

        {results.length === 0 ? (
          <EmptyState
            title="No matching products"
            description="Try searching with a different product name, ingredient, or batch number."
          />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ProductCard
                product={item}
                isBookmarked={isSaved(item.id)}
                onBookmarkPress={() => toggleSaved(item.id)}
                onPress={() => router.push(`/product/${item.id}` as any)}
              />
            )}
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
    backgroundColor: Colors.cream,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xs,
  },
  resultsHeader: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.sm,
    color: Colors.textMuted,
    marginVertical: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
