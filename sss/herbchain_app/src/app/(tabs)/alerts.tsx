import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Type, Spacing } from '@/theme';
import { AppHeader } from '@/components/Header';
import { AlertCard, FilterChips, EmptyState } from '@/components/CardsAndInputs';
import { useProductStore } from '@/store/productStore';

export default function AlertsScreen() {
  const router = useRouter();
  const { alerts, markAlertRead } = useProductStore();

  const [selectedFilter, setSelectedFilter] = useState('All');

  const filterOptions = ['All', 'Recall', 'Expiry', 'Verification', 'Safety', 'Security'];

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
      <AppHeader title="Alerts & Notifications" />

      <View style={styles.content}>
        <Text style={styles.pageTitle}>Alerts &amp; Notifications</Text>

        <FilterChips
          options={filterOptions}
          selected={selectedFilter}
          onSelect={setSelectedFilter}
        />

        {filteredAlerts.length === 0 ? (
          <EmptyState
            title="You're all caught up"
            description="No active alerts or safety warnings matching your selected category."
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
