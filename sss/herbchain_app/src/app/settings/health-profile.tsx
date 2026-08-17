import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Type, Spacing, BorderRadius } from '@/theme';
import { AppHeader } from '@/components/Header';
import Icon from '@/components/Icon';
import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import FormField from '@/components/forms/FormField';
import { OptionGroup, ChipMultiSelect, ConsentCheckbox } from '@/components/forms/Selection';
import {
  ALLERGY_OPTIONS,
  CONDITION_OPTIONS,
  TRI_STATE_OPTIONS,
  ALLERGY_TRI_STATE,
  CONDITION_TRI_STATE,
  PREGNANCY_STATUS_OPTIONS,
  DIETARY_PREFERENCE_OPTIONS,
  AYURVEDIC_PREFERENCE_OPTIONS,
  COMMON_AYURVEDIC_INGREDIENTS,
  MEDICAL_HISTORY_OPTIONS,
  CURRENT_MEDICATION_OPTIONS,
} from '@/features/registration/constants';
import { apiRequest, ApiError } from '@/lib/api';
import type { HealthProfile, TriState, PregnancyStatus } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { GuestGate } from '@/components/GuestGate';

const emptyProfile: HealthProfile = {
  hasAllergies: 'undisclosed',
  allergies: [],
  allergyNotes: '',
  ingredientAllergies: [],
  hasCurrentHealthIssues: 'undisclosed',
  currentHealthIssues: '',
  hasExistingConditions: 'undisclosed',
  conditions: [],
  medicalHistoryTags: [],
  medicalHistory: '',
  currentMedicationTags: [],
  currentMedications: '',
  previousAdverseReactions: '',
  pregnancyStatus: 'undisclosed',
  dietaryPreferences: [],
  ayurvedicPreferences: [],
  consentStoreHealthData: false,
  consentPersonalizedAlerts: false,
};

export default function HealthProfileScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isGuest = useAuthStore((s) => s.isGuest);
  const canUseHealthProfile = isAuthenticated && !isGuest;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<HealthProfile>(emptyProfile);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const set = <K extends keyof HealthProfile>(key: K, value: HealthProfile[K]) =>
    setProfile((p) => ({ ...p, [key]: value }));

  useEffect(() => {
    if (!canUseHealthProfile) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await apiRequest<HealthProfile | null>('/health-profile');
        if (data) setProfile({ ...emptyProfile, ...data });
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not load your health profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, [canUseHealthProfile]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSavedNotice(false);
    try {
      const saved = await apiRequest<HealthProfile | null>('/health-profile', {
        method: 'PUT',
        body: JSON.stringify(profile),
      });
      if (saved) setProfile({ ...emptyProfile, ...saved });
      setSavedNotice(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your health profile.');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Delete health data?',
      'This permanently removes your stored allergies, conditions, and other health information. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: handleDelete },
      ],
    );
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await apiRequest('/health-profile', { method: 'DELETE' });
      setProfile(emptyProfile);
      setSavedNotice(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete your health profile.');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader showBack onBackPress={() => router.back()} title="Health Profile" />
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showBack onBackPress={() => router.back()} title="Health Profile" />

      <GuestGate message="Sign in to add and manage your health profile.">
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.noticeCard}>
          <Icon name="shield-checkmark" size={18} color={Colors.onSecondaryContainer} />
          <Text style={styles.noticeText}>
            Every field here is optional. This information helps AyurTrace+ flag potential allergy
            conflicts and personalize product guidance — it is never shown to other users.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Allergies</Text>
        <OptionGroup
          label="Do you have any allergies?"
          options={ALLERGY_TRI_STATE}
          value={profile.hasAllergies}
          onSelect={(v) => set('hasAllergies', v as TriState)}
        />
        {profile.hasAllergies === 'yes' && (
          <>
            <ChipMultiSelect
              label="Select your allergy categories"
              options={ALLERGY_OPTIONS}
              selected={profile.allergies}
              onToggle={(v) =>
                set('allergies', profile.allergies.includes(v) ? profile.allergies.filter((a) => a !== v) : [...profile.allergies, v])
              }
            />
            <FormField
              scrollViewRef={scrollRef}
              label="Allergy details"
              value={profile.allergyNotes ?? ''}
              onChangeText={(v) => set('allergyNotes', v)}
              placeholder="Anything specific we should know?"
              multiline
              optional
            />
          </>
        )}

        <ChipMultiSelect
          label="Specific Ayurvedic ingredients you're allergic to"
          hint="Used to flag products containing these ingredients — optional, and separate from the categories above."
          options={COMMON_AYURVEDIC_INGREDIENTS}
          selected={profile.ingredientAllergies}
          onToggle={(v) =>
            set(
              'ingredientAllergies',
              profile.ingredientAllergies.includes(v)
                ? profile.ingredientAllergies.filter((a) => a !== v)
                : [...profile.ingredientAllergies, v],
            )
          }
        />

        <Text style={styles.sectionLabel}>Current Health</Text>
        <OptionGroup
          label="Do you have any current health issues?"
          options={TRI_STATE_OPTIONS}
          value={profile.hasCurrentHealthIssues}
          onSelect={(v) => set('hasCurrentHealthIssues', v as TriState)}
        />
        {profile.hasCurrentHealthIssues === 'yes' && (
          <FormField
            label="Describe your health issue"
            value={profile.currentHealthIssues ?? ''}
            onChangeText={(v) => set('currentHealthIssues', v)}
            placeholder="Briefly describe what you're experiencing"
            multiline
            optional
          />
        )}

        <OptionGroup
          label="Do you have any existing health conditions?"
          options={CONDITION_TRI_STATE}
          value={profile.hasExistingConditions}
          onSelect={(v) => set('hasExistingConditions', v as TriState)}
        />
        {profile.hasExistingConditions === 'yes' && (
          <ChipMultiSelect
            label="Select your conditions"
            options={CONDITION_OPTIONS}
            selected={profile.conditions}
            onToggle={(v) =>
              set('conditions', profile.conditions.includes(v) ? profile.conditions.filter((c) => c !== v) : [...profile.conditions, v])
            }
          />
        )}

        <ChipMultiSelect
          label="Medical History"
          options={MEDICAL_HISTORY_OPTIONS}
          selected={profile.medicalHistoryTags}
          onToggle={(v) =>
            set(
              'medicalHistoryTags',
              profile.medicalHistoryTags.includes(v)
                ? profile.medicalHistoryTags.filter((t) => t !== v)
                : [...profile.medicalHistoryTags, v]
            )
          }
        />
        <FormField
          label="Further details"
          value={profile.medicalHistory ?? ''}
          onChangeText={(v) => set('medicalHistory', v)}
          placeholder="Add any specifics not covered above"
          multiline
          optional
        />

        <ChipMultiSelect
          label="Current Medications"
          options={CURRENT_MEDICATION_OPTIONS}
          selected={profile.currentMedicationTags}
          onToggle={(v) =>
            set(
              'currentMedicationTags',
              profile.currentMedicationTags.includes(v)
                ? profile.currentMedicationTags.filter((t) => t !== v)
                : [...profile.currentMedicationTags, v]
            )
          }
        />
        <FormField
          label="Further details"
          value={profile.currentMedications ?? ''}
          onChangeText={(v) => set('currentMedications', v)}
          placeholder="Specific medicine names, dosage, or supplements"
          multiline
          optional
        />
        <FormField
          label="Previous Adverse Reactions"
          value={profile.previousAdverseReactions ?? ''}
          onChangeText={(v) => set('previousAdverseReactions', v)}
          placeholder="Any past reaction to a medicine, herb, or supplement?"
          multiline
          optional
        />

        <Text style={styles.sectionLabel}>Preferences</Text>
        <OptionGroup
          label="Pregnancy / breastfeeding status"
          options={PREGNANCY_STATUS_OPTIONS}
          value={profile.pregnancyStatus}
          onSelect={(v) => set('pregnancyStatus', v as PregnancyStatus)}
        />
        <ChipMultiSelect
          label="Dietary preferences"
          options={DIETARY_PREFERENCE_OPTIONS}
          selected={profile.dietaryPreferences}
          onToggle={(v) =>
            set(
              'dietaryPreferences',
              profile.dietaryPreferences.includes(v)
                ? profile.dietaryPreferences.filter((d) => d !== v)
                : [...profile.dietaryPreferences, v],
            )
          }
        />
        <ChipMultiSelect
          label="Ayurvedic preferences"
          options={AYURVEDIC_PREFERENCE_OPTIONS}
          selected={profile.ayurvedicPreferences}
          onToggle={(v) =>
            set(
              'ayurvedicPreferences',
              profile.ayurvedicPreferences.includes(v)
                ? profile.ayurvedicPreferences.filter((a) => a !== v)
                : [...profile.ayurvedicPreferences, v],
            )
          }
        />

        <Text style={styles.sectionLabel}>Privacy</Text>
        <ConsentCheckbox
          label="Store my health and allergy information"
          description="Turning this off and saving permanently deletes any health data already stored."
          checked={profile.consentStoreHealthData}
          onToggle={() => set('consentStoreHealthData', !profile.consentStoreHealthData)}
        />
        <ConsentCheckbox
          label="Send me personalized safety and product alerts"
          description="Recall notices and allergy warnings for products you've scanned."
          checked={profile.consentPersonalizedAlerts}
          onToggle={() => set('consentPersonalizedAlerts', !profile.consentPersonalizedAlerts)}
        />

        {error ? (
          <View style={styles.errorCard}>
            <Icon name="alert-circle" size={16} color={Colors.error} />
            <Text style={styles.errorCardText}>{error}</Text>
          </View>
        ) : null}

        {savedNotice && !error ? (
          <View style={styles.savedCard}>
            <Icon name="checkmark-circle" size={16} color={Colors.onSecondaryContainer} />
            <Text style={styles.savedCardText}>Your health profile has been updated.</Text>
          </View>
        ) : null}

        <PrimaryButton
          title="Save Changes"
          onPress={handleSave}
          loading={saving}
          disabled={deleting}
          size="lg"
          style={{ marginTop: Spacing.lg }}
        />
        <SecondaryButton
          title="Delete My Health Data"
          onPress={confirmDelete}
          loading={deleting}
          disabled={saving}
          icon="trash-outline"
          size="lg"
          style={{ marginTop: Spacing.md, borderColor: Colors.error }}
          textStyle={{ color: Colors.error }}
        />
      </ScrollView>
      </GuestGate>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: Spacing.gutter, paddingTop: Spacing.base, paddingBottom: 320 },
  sectionLabel: {
    ...Type.headlineSm,
    color: Colors.primary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: Colors.secondaryContainer,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  noticeText: { ...Type.bodySm, color: Colors.onSecondaryContainer, flex: 1 },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.errorContainer,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.base,
  },
  errorCardText: { ...Type.bodySm, color: Colors.onErrorContainer, flex: 1 },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.secondaryContainer,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.base,
  },
  savedCardText: { ...Type.bodySm, color: Colors.onSecondaryContainer, flex: 1 },
});
