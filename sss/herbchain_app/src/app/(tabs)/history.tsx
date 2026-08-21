import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors, Fonts, Type, Spacing, BorderRadius } from '@/theme';
import { AppHeader } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { SearchBar, FilterChips, EmptyState } from '@/components/CardsAndInputs';
import { useProductStore } from '@/store/productStore';
import { getProductById } from '@/data/mockProducts';

export default function HistoryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { scanHistory, isSaved, toggleSaved } = useProductStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  const filterOptions = [
    { key: 'All', label: t('common.all') },
    { key: 'Verified', label: t('common.verified') },
    { key: 'Warning', label: t('common.warning') },
    { key: 'Recalled', label: t('common.recalled') },
    { key: 'Expired', label: t('common.expired') },
  ];

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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <AppHeader title={t('history.title')} />

      <View style={styles.content}>
        <Text style={styles.pageTitle}>{t('history.title')}</Text>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('history.searchPlaceholder')}
        />

        <FilterChips
          options={filterOptions}
          selected={selectedFilter}
          onSelect={setSelectedFilter}
        />

        {filteredHistory.length === 0 ? (
          <EmptyState
            title={t('history.noScansFound')}
            description={scanHistory.length === 0 ? t('history.noScansDesc') : t('history.noMatchDesc')}
            actionText={scanHistory.length === 0 ? t('history.scanProductNow') : undefined}
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
                        ⚠️ {t('history.statusUpdatedBanner')}
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
