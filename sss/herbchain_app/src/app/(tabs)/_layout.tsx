import React from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors, Fonts, BorderRadius } from '@/theme';
import Icon, { IconName } from '@/components/Icon';
import { View, StyleSheet } from 'react-native';

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.secondary,
        tabBarInactiveTintColor: Colors.outline,
        tabBarStyle: {
          backgroundColor: Colors.surfaceContainerLow,
          borderTopWidth: 0,
          height: 78,
          paddingBottom: 12,
          paddingTop: 10,
          paddingHorizontal: 8,
          // Soft upward ambient lift instead of a hard divider rule.
          shadowColor: '#0B3B20',
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.04,
          shadowRadius: 30,
          elevation: 12,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontFamily: Fonts.family.medium,
          fontSize: 11,
          marginTop: 2,
        },
        tabBarIcon: ({ color, focused }) => {
          // Centre Scan action reads as a raised botanical seal.
          if (route.name === 'scan') {
            return (
              <View style={styles.scanFab}>
                <Icon name="qr-code" size={24} color={Colors.onPrimary} />
              </View>
            );
          }

          let iconName: IconName = 'home';
          if (route.name === 'index') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'products') {
            iconName = focused ? 'leaf' : 'leaf-outline';
          } else if (route.name === 'ebuy') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          // Active destination sits inside a soft mint pill.
          return (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Icon name={iconName} size={22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: t('nav.home') }} />
      <Tabs.Screen name="products" options={{ title: t('nav.products') }} />
      <Tabs.Screen name="scan" options={{ title: t('nav.scan') }} />
      <Tabs.Screen name="ebuy" options={{ title: t('nav.ebuy') }} />
      <Tabs.Screen name="profile" options={{ title: t('nav.profile') }} />
      {/* Still reachable via the header bell icon — just no longer a duplicate bottom-tab entry. */}
      <Tabs.Screen name="alerts" options={{ href: null }} />
      {/* Still reachable via Profile → Scan History — just no longer a duplicate bottom-tab entry. */}
      <Tabs.Screen name="history" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    minWidth: 56,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: Colors.secondaryContainer,
  },
  scanFab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderWidth: 3,
    borderColor: Colors.surface,
    shadowColor: '#0B3B20',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
  },
});
