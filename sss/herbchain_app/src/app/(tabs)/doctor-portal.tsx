import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Colors, Fonts, Type, Spacing, BorderRadius, Shadow } from '@/theme';
import { AppHeader } from '@/components/Header';
import Icon from '@/components/Icon';
import { doctorService, type AyurvedicDoctor, type NearbyDoctor } from '@/services/doctorService';

type LoadState = 'idle' | 'requesting' | 'loading' | 'ready' | 'denied' | 'error';

export default function DoctorPortalScreen() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>('idle');
  const [doctors, setDoctors] = useState<(AyurvedicDoctor | NearbyDoctor)[]>([]);
  const [usedFallback, setUsedFallback] = useState(false);

  async function load() {
    setState('requesting');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState('denied');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setState('loading');

      const found = await doctorService.findNearest(pos.coords.latitude, pos.coords.longitude, 5);
      setDoctors(found);
      setUsedFallback(false);
      setState('ready');
    } catch {
      setState('error');
    }
  }

  async function loadAnyway() {
    setState('loading');
    try {
      const found = await doctorService.findAny();
      setDoctors(found);
      setUsedFallback(true);
      setState('ready');
    } catch {
      setState('error');
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <AppHeader title="Doctor Portal" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Consult an Ayurvedic Doctor</Text>
        <Text style={styles.pageSub}>
          A reference directory of government-registered and verified-listing Ayurveda practitioners.
          Since we can't reach every doctor individually, consultations here use AyurTrace+'s AI to
          answer your questions — the selected clinic is shown as a suggested contact, not the author
          of the response.
        </Text>

        {(state === 'idle' || state === 'requesting' || state === 'loading') && (
          <View style={[styles.stateBox, Shadow.sm]}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.stateText}>Finding doctors near you…</Text>
          </View>
        )}

        {state === 'denied' && (
          <View style={[styles.stateBox, Shadow.sm]}>
            <Icon name="location-outline" size={28} color={Colors.textMuted} />
            <Text style={styles.stateText}>Location permission is needed to find the nearest doctors.</Text>
            <View style={styles.stateBtnRow}>
              <TouchableOpacity onPress={load} style={styles.retryBtn}>
                <Text style={styles.retryBtnText}>Allow Location</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={loadAnyway} style={[styles.retryBtn, styles.retryBtnSecondary]}>
                <Text style={[styles.retryBtnText, styles.retryBtnTextSecondary]}>Show Any Doctors</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {state === 'error' && (
          <View style={[styles.stateBox, Shadow.sm]}>
            <Icon name="alert-circle-outline" size={28} color={Colors.textMuted} />
            <Text style={styles.stateText}>Could not load doctors.</Text>
            <TouchableOpacity onPress={load} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {state === 'ready' && doctors.length === 0 && (
          <View style={[styles.stateBox, Shadow.sm]}>
            <Icon name="medkit-outline" size={28} color={Colors.textMuted} />
            <Text style={styles.stateText}>No doctors found in the directory yet.</Text>
            <TouchableOpacity onPress={load} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {state === 'ready' && doctors.length > 0 && (
          <>
            {usedFallback && (
              <Text style={styles.resultsNote}>Showing doctors across Tamil Nadu (location unavailable)</Text>
            )}

            {doctors.map((doctor) => (
              <View key={doctor.id} style={[styles.doctorCard, Shadow.sm]}>
                <View style={styles.doctorTopRow}>
                  <View style={styles.doctorAvatar}>
                    <Icon name="medkit-outline" size={26} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.doctorName} numberOfLines={1}>{doctor.doctorName}</Text>
                    {doctor.clinicHospitalName && (
                      <Text style={styles.doctorClinic} numberOfLines={1}>{doctor.clinicHospitalName}</Text>
                    )}
                  </View>
                  {doctor.verificationStatus && (
                    <View style={styles.verifiedBadge}>
                      <View style={styles.verifiedDot} />
                      <Text style={styles.verifiedBadgeText}>Verified</Text>
                    </View>
                  )}
                </View>

                <View style={styles.doctorTagsRow}>
                  {doctor.qualification && (
                    <View style={styles.tagPill}>
                      <Text style={styles.tagPillText} numberOfLines={1}>{doctor.qualification}</Text>
                    </View>
                  )}
                  <View style={styles.tagPill}>
                    <Icon name="location-outline" size={11} color={Colors.onSecondaryContainer} />
                    <Text style={styles.tagPillText}>
                      {doctor.district}
                      {'distanceKm' in doctor ? ` · ${doctor.distanceKm} km` : ''}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.consultBtn}
                  onPress={() => router.push(`/doctor-consult/${doctor.id}` as any)}
                >
                  <Icon name="chatbubbles-outline" size={16} color={Colors.onPrimary} />
                  <Text style={styles.consultBtnText}>Consult</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { paddingHorizontal: Spacing.gutter, paddingTop: Spacing.sm, paddingBottom: Spacing['3xl'] },
  pageTitle: { ...Type.headlineLgMobile, color: Colors.primary, marginBottom: 4 },
  pageSub: { ...Type.bodySm, color: Colors.onSurfaceVariant, marginBottom: Spacing.lg, lineHeight: 18 },
  stateBox: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  stateText: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  stateBtnRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  retryBtn: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  retryBtnSecondary: {
    backgroundColor: Colors.surfaceContainerHigh,
  },
  retryBtnText: { fontFamily: Fonts.family.semiBold, fontSize: Fonts.size.xs + 1, color: Colors.onPrimary },
  retryBtnTextSecondary: { color: Colors.onSurfaceVariant },
  resultsNote: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs + 1,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  doctorCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  doctorTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  doctorAvatar: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorName: { fontFamily: Fonts.family.semiBold, fontSize: Fonts.size.sm + 2, color: Colors.onSurface },
  doctorClinic: { fontFamily: Fonts.family.regular, fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  verifiedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  verifiedBadgeText: { fontFamily: Fonts.family.semiBold, fontSize: 10, color: Colors.onSecondaryContainer },
  doctorTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.lightGreen + '80',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    maxWidth: '100%',
  },
  tagPillText: { fontFamily: Fonts.family.medium, fontSize: 11, color: Colors.onSecondaryContainer },
  consultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  consultBtnText: { fontFamily: Fonts.family.semiBold, fontSize: Fonts.size.xs + 1, color: Colors.onPrimary },
});
