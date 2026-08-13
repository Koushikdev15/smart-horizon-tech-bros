import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing } from '@/theme';
import { AppHeader } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { EmptyState } from '@/components/CardsAndInputs';
import { useProductStore } from '@/store/productStore';
import { getProductById } from '@/data/mockProducts';

export default function SavedProductsScreen() {
  const router = useRouter();
  const { savedProductIds, isSaved, toggleSaved } = useProductStore();

  const savedProducts = savedProductIds
    .map((id) => getProductById(id))
    .filter(Boolean);

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showBack onBackPress={() => router.back()} title="Saved Products" />

      <View style={styles.content}>
        {savedProducts.length === 0 ? (
          <EmptyState
            title="No saved products"
            description="Save verified products for quick access, recall monitoring, and expiry tracking later."
            actionText="Discover Products"
            onAction={() => router.push('/search')}
          />
        ) : (
          <FlatList
            data={savedProducts}
            keyExtractor={(item) => item!.id}
            renderItem={({ item }) => (
              <ProductCard
                product={item!}
                isBookmarked={true}
                onBookmarkPress={() => toggleSaved(item!.id)}
                onPress={() => router.push(`/product/${item!.id}` as any)}
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
});
