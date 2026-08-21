import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors, Type, Spacing } from '@/theme';
import { AppHeader } from '@/components/Header';
import { AlertCard, FilterChips, EmptyState } from '@/components/CardsAndInputs';
import { useProductStore } from '@/store/productStore';

export default function AlertsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { alerts, markAlertRead } = useProductStore();

  const [selectedFilter, setSelectedFilter] = useState('All');

  const filterOptions = [
    { key: 'All', label: t('common.all') },
    { key: 'Recall', label: t('alerts.recall') },
    { key: 'Expiry', label: t('alerts.expiryAlert') },
    { key: 'Verification', label: t('alerts.verification') },
    { key: 'Safety', label: t('alerts.safety') },
    { key: 'Security', label: t('alerts.security') },
  ];

  const filteredAlerts = alerts.filter((a) => {
    if (selectedFilter === 'All') return true;
    return a.type.toLowerCase() === selectedFilter.toLowerCase();
  });

  const handleAlertPress = (alertItem: any) => {
    markAlertRead(alertItem.id);
    if (alertItem.productId) {
      router.push(`/product/${alertItem.productId}` as any);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <AppHeader title={t('alerts.title')} />

      <View style={styles.content}>
        <Text style={styles.pageTitle}>{t('alerts.title')}</Text>

        <FilterChips
          options={filterOptions}
          selected={selectedFilter}
          onSelect={setSelectedFilter}
        />

        {filteredAlerts.length === 0 ? (
          <EmptyState
            title={t('alerts.allCaughtUp')}
            description={t('alerts.noneDesc')}
          />
        ) : (
          <FlatList
            data={filteredAlerts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <AlertCard alert={item} onPress={() => handleAlertPress(item)} />
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
});
