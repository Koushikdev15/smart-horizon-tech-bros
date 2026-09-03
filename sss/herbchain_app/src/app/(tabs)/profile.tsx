import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors, Type, Spacing, BorderRadius, Shadow } from '@/theme';
import { AppHeader } from '@/components/Header';
import Icon, { IconName } from '@/components/Icon';
import { useAuthStore } from '@/store/authStore';
import { SUPPORTED_LANGUAGES } from '@/i18n';

interface ProfileMenuItem {
  id: string;
  title: string;
  icon: IconName;
  route?: string;
  badge?: string;
  action?: () => void;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isGuest, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const sections: { title: string; items: ProfileMenuItem[] }[] = [
    {
      title: t('profileScreen.sectionAccount'),
      items: [
        { id: 'health-profile', title: t('profileScreen.healthProfile'), icon: 'medkit-outline', route: '/settings/health-profile' },
        { id: 'saved', title: t('profileScreen.savedProducts'), icon: 'bookmark-outline', route: '/saved' },
        { id: 'history', title: t('profileScreen.scanHistory'), icon: 'time-outline', route: '/(tabs)/history' },
        { id: 'report', title: t('profileScreen.reportIssue'), icon: 'flag-outline', route: '/report' },
      ],
    },
    {
      title: t('profileScreen.sectionPreferences'),
      items: [
        { id: 'notifications', title: t('profileScreen.notificationPrefs'), icon: 'notifications-outline', route: '/settings/notifications' },
        {
          id: 'language',
          title: t('profileScreen.language'),
          icon: 'language-outline',
          route: '/settings/language',
          badge: SUPPORTED_LANGUAGES.find((l) => l.code === user?.language)?.nativeLabel ?? 'English',
        },
        { id: 'privacy', title: t('profileScreen.privacySecurity'), icon: 'shield-outline', route: '/settings/privacy' },
      ],
    },
    {
      title: t('profileScreen.sectionSupport'),
      items: [
        { id: 'about', title: t('profileScreen.aboutApp'), icon: 'information-circle-outline', route: '/settings/about' },
        { id: 'help', title: t('profileScreen.helpSupport'), icon: 'help-circle-outline', action: () => alert('Support email: support@ayurtrace.org') },
        { id: 'terms', title: t('profileScreen.terms'), icon: 'document-text-outline', action: () => alert('Terms of Service v1.0 — Government Certified Platform') },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <AppHeader title={t('profileScreen.title')} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User identity */}
        <View style={styles.userCard}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarCircle}>
              <Icon name="person" size={40} color={Colors.primaryContainer} />
            </View>
          </View>

          <Text style={styles.userName}>{user?.name || t('profileScreen.guestUser')}</Text>

          <View style={styles.memberChip}>
            <Text style={styles.memberChipText}>
              {isGuest ? t('profileScreen.guestAccess') : t('profileScreen.verifiedMember')}
            </Text>
          </View>

          <Text style={styles.userSub}>
            {user?.email || (isGuest ? t('profileScreen.signInToSave') : t('profileScreen.noEmail'))}
          </Text>
          {user?.phone && <Text style={styles.userPhone}>{user.phone}</Text>}
          {user?.ayurvedicId && (
            <View style={styles.ayurvedicIdChip}>
              <Icon name="finger-print-outline" size={13} color={Colors.onTertiaryContainer} />
              <Text style={styles.ayurvedicIdText}>{user.ayurvedicId}</Text>
            </View>
          )}

          {isGuest && (
            <TouchableOpacity style={styles.loginChip} onPress={() => router.push('/login')}>
              <Text style={styles.loginChipText}>{t('profileScreen.login')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Menu Sections */}
        {sections.map((sec) => (
          <View key={sec.title} style={styles.menuSection}>
            <Text style={styles.sectionHeaderTitle}>{sec.title}</Text>
            <View style={[styles.menuCard, Shadow.sm]}>
              {sec.items.map((item, idx) => {
                const isLast = idx === sec.items.length - 1;
                return (
                  <React.Fragment key={item.id}>
                    <TouchableOpacity
                      style={styles.menuRow}
                      onPress={() => {
                        if (item.route) router.push(item.route as any);
                        else if (item.action) item.action();
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.menuIconBox}>
                        <Icon name={item.icon} size={20} color={Colors.primary} />
                      </View>
                      <Text style={styles.menuTitle}>{item.title}</Text>

                      {item.badge && (
                        <View style={styles.badgeBox}>
                          <Text style={styles.badgeText}>{item.badge}</Text>
                        </View>
                      )}

                      <Icon name="chevron-forward" size={18} color={Colors.textMuted} />
                    </TouchableOpacity>

                    {!isLast && <View style={styles.rowDivider} />}
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Icon name="log-out-outline" size={20} color={Colors.error} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>{isGuest ? t('profileScreen.exitGuest') : t('profileScreen.signOut')}</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>AyurTrace+ Mobile v1.0.0 • Build 2026.08</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    paddingHorizontal: Spacing.gutter,
    paddingBottom: Spacing['3xl'],
  },
  // Centred identity block with a gold "seal" ring around the portrait.
  userCard: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  avatarRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 2,
    borderColor: Colors.onTertiaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  avatarCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfoCol: {
    flex: 1,
  },
  userName: {
    ...Type.headlineMd,
    color: Colors.primary,
  },
  memberChip: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: Spacing.base,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  memberChipText: {
    ...Type.labelMd,
    color: Colors.onTertiaryContainer,
  },
  userSub: {
    ...Type.bodySm,
    color: Colors.onSurfaceVariant,
    marginTop: Spacing.sm,
  },
  userPhone: {
    ...Type.bodySm,
    color: Colors.outline,
    marginTop: 2,
  },
  ayurvedicIdChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.tertiaryFixed,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  ayurvedicIdText: {
    ...Type.labelMd,
    fontSize: 12,
    color: Colors.onTertiaryContainer,
    letterSpacing: 0.3,
  },
  loginChip: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.base,
  },
  loginChipText: {
    ...Type.labelMd,
    color: Colors.onPrimary,
  },
  menuSection: {
    marginBottom: Spacing.lg,
  },
  sectionHeaderTitle: {
    ...Type.labelCaps,
    color: Colors.outline,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  menuCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuTitle: {
    flex: 1,
    ...Type.bodyMd,
    color: Colors.onSurface,
  },
  badgeBox: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginRight: Spacing.sm,
  },
  badgeText: {
    ...Type.bodySm,
    color: Colors.outline,
  },
  // Hairline separators indented past the icon column.
  rowDivider: {
    height: 1,
    backgroundColor: Colors.outlineVariant,
    opacity: 0.5,
    marginLeft: 64,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.errorContainer,
    borderRadius: BorderRadius['2xl'],
    paddingVertical: Spacing.base,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  logoutText: {
    ...Type.labelMd,
    fontSize: 16,
    color: Colors.onErrorContainer,
  },
  versionText: {
    ...Type.bodySm,
    color: Colors.outline,
    textAlign: 'center',
  },
});
