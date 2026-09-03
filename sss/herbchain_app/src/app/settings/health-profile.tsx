import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
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
import { supabase } from '@/lib/supabase';
import type { HealthProfile, TriState, PregnancyStatus } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { GuestGate } from '@/components/GuestGate';

/** public.customer_wellness row <-> the app's HealthProfile type. */
function rowToHealthProfile(row: Record<string, any>): HealthProfile {
  return {
    hasAllergies: row.has_allergies,
    allergies: row.allergies ?? [],
    allergyNotes: row.allergy_notes ?? '',
    ingredientAllergies: row.ingredient_allergies ?? [],
    hasCurrentHealthIssues: row.has_current_health_issues,
    currentHealthIssues: row.current_health_issues ?? '',
    hasExistingConditions: row.has_existing_conditions,
    conditions: row.conditions ?? [],
    medicalHistoryTags: row.medical_history_tags ?? [],
    medicalHistory: row.medical_history ?? '',
    currentMedicationTags: row.current_medication_tags ?? [],
    currentMedications: row.current_medications ?? '',
    previousAdverseReactions: row.previous_adverse_reactions ?? '',
    pregnancyStatus: row.pregnancy_status,
    dietaryPreferences: row.dietary_preferences ?? [],
    ayurvedicPreferences: row.ayurvedic_preferences ?? [],
    consentStoreHealthData: row.consent_store_health_data,
    consentPersonalizedAlerts: row.consent_personalized_alerts,
    updatedAt: row.updated_at,
  };
}

function healthProfileToRow(userId: string, p: HealthProfile) {
  return {
    user_id: userId,
    has_allergies: p.hasAllergies,
    allergies: p.allergies,
    allergy_notes: p.allergyNotes || null,
    ingredient_allergies: p.ingredientAllergies,
    has_current_health_issues: p.hasCurrentHealthIssues,
    current_health_issues: p.currentHealthIssues || null,
    has_existing_conditions: p.hasExistingConditions,
    conditions: p.conditions,
    medical_history_tags: p.medicalHistoryTags,
    medical_history: p.medicalHistory || null,
    current_medication_tags: p.currentMedicationTags,
    current_medications: p.currentMedications || null,
    previous_adverse_reactions: p.previousAdverseReactions || null,
    pregnancy_status: p.pregnancyStatus,
    dietary_preferences: p.dietaryPreferences,
    ayurvedic_preferences: p.ayurvedicPreferences,
    consent_store_health_data: p.consentStoreHealthData,
    consent_personalized_alerts: p.consentPersonalizedAlerts,
  };
}

const TRI_STATE_LABEL: Record<TriState, string> = { yes: 'Yes', no: 'No', undisclosed: 'Not disclosed' };
const PREGNANCY_LABEL: Record<PregnancyStatus, string> = {
  not_applicable: 'Not applicable',
  pregnant: 'Pregnant',
  breastfeeding: 'Breastfeeding',
  planning: 'Planning pregnancy',
  undisclosed: 'Not disclosed',
};

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function htmlList(items: string[]): string {
  return items.length ? `<ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>` : '<p class="muted">None recorded</p>';
}

function htmlField(label: string, value: string | undefined | null): string {
  return `<div class="field"><span class="label">${escapeHtml(label)}:</span> ${value ? escapeHtml(value) : '<span class="muted">Not provided</span>'}</div>`;
}

/**
 * Every sub-field of the health profile, laid out plainly so it can be used
 * directly as an input to a risk analysis — no data is summarized or
 * omitted, only formatted.
 */
function buildHealthProfileHtml(profile: HealthProfile, name: string, ayurvedicId?: string): string {
  const generatedAt = new Date().toLocaleString();
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1c1c15; padding: 32px; }
  h1 { color: #002410; font-size: 22px; margin-bottom: 2px; }
  .subtitle { color: #717971; font-size: 12px; margin-bottom: 24px; }
  h2 { color: #002410; font-size: 15px; border-bottom: 1px solid #c1c9bf; padding-bottom: 4px; margin-top: 24px; }
  .field { font-size: 13px; margin: 6px 0; }
  .label { font-weight: 600; }
  .muted { color: #717971; }
  ul { margin: 6px 0; padding-left: 20px; font-size: 13px; }
  li { margin-bottom: 2px; }
</style>
</head>
<body>
  <h1>AyurTrace+ Health Profile</h1>
  <div class="subtitle">
    ${escapeHtml(name)}${ayurvedicId ? ` &middot; ${escapeHtml(ayurvedicId)}` : ''} &middot; Generated ${escapeHtml(generatedAt)}
  </div>

  <h2>Allergies</h2>
  ${htmlField('Has allergies', TRI_STATE_LABEL[profile.hasAllergies] ?? 'Not specified')}
  <div class="field"><span class="label">Allergy categories:</span></div>
  ${htmlList(profile.allergies)}
  ${htmlField('Allergy details', profile.allergyNotes)}
  <div class="field"><span class="label">Specific ingredient allergies:</span></div>
  ${htmlList(profile.ingredientAllergies)}

  <h2>Current Health</h2>
  ${htmlField('Has current health issues', TRI_STATE_LABEL[profile.hasCurrentHealthIssues] ?? 'Not specified')}
  ${htmlField('Description', profile.currentHealthIssues)}
  ${htmlField('Has existing conditions', TRI_STATE_LABEL[profile.hasExistingConditions] ?? 'Not specified')}
  <div class="field"><span class="label">Conditions:</span></div>
  ${htmlList(profile.conditions)}

  <h2>Medical History</h2>
  <div class="field"><span class="label">Tags:</span></div>
  ${htmlList(profile.medicalHistoryTags)}
  ${htmlField('Further details', profile.medicalHistory)}

  <h2>Medications</h2>
  <div class="field"><span class="label">Current medication tags:</span></div>
  ${htmlList(profile.currentMedicationTags)}
  ${htmlField('Further details', profile.currentMedications)}
  ${htmlField('Previous adverse reactions', profile.previousAdverseReactions)}

  <h2>Preferences</h2>
  ${htmlField('Pregnancy / breastfeeding status', PREGNANCY_LABEL[profile.pregnancyStatus] ?? 'Not specified')}
  <div class="field"><span class="label">Dietary preferences:</span></div>
  ${htmlList(profile.dietaryPreferences)}
  <div class="field"><span class="label">Ayurvedic preferences:</span></div>
  ${htmlList(profile.ayurvedicPreferences)}

  <h2>Consent</h2>
  ${htmlField('Consented to store health data', profile.consentStoreHealthData ? 'Yes' : 'No')}
  ${htmlField('Consented to personalized alerts', profile.consentPersonalizedAlerts ? 'Yes' : 'No')}
  ${htmlField('Last updated', profile.updatedAt ? new Date(profile.updatedAt).toLocaleString() : undefined)}
</body>
</html>`;
}

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
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;
  const canUseHealthProfile = isAuthenticated && !isGuest && Boolean(userId);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<HealthProfile>(emptyProfile);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
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
      const { data, error: fetchError } = await supabase
        .from('customer_wellness')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (fetchError) {
        setError(fetchError.message || 'Could not load your health profile.');
      } else if (data) {
        setProfile({ ...emptyProfile, ...rowToHealthProfile(data) });
      }
      setLoading(false);
    })();
  }, [canUseHealthProfile, userId]);

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    setError(null);
    setSavedNotice(false);

    const { data, error: saveError } = await supabase
      .from('customer_wellness')
      .upsert(healthProfileToRow(userId, profile), { onConflict: 'user_id' })
      .select('*')
      .single();

    setSaving(false);

    if (saveError) {
      setError(saveError.message || 'Could not save your health profile.');
      return;
    }
    if (data) setProfile({ ...emptyProfile, ...rowToHealthProfile(data) });
    setSavedNotice(true);
  }

  async function handleExportPdf() {
    setExporting(true);
    setError(null);
    try {
      const html = buildHealthProfileHtml(profile, user?.name || 'AyurTrace+ User', user?.ayurvedicId);
      // Getting the PDF back as base64 and writing it out ourselves — rather
      // than reading/copying expo-print's own cache/Print/ output file —
      // sidesteps whatever is blocking reads from that specific path on this
      // device; the file we hand to Sharing is one our own code created.
      const { base64 } = await Print.printToFileAsync({ html, base64: true });
      if (!base64) throw new Error('PDF generation did not return file data.');
      const shareUri = `${FileSystem.cacheDirectory}HealthProfile-${Date.now()}.pdf`;
      await FileSystem.writeAsStringAsync(shareUri, base64, { encoding: FileSystem.EncodingType.Base64 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(shareUri, { mimeType: 'application/pdf', dialogTitle: 'Health Profile PDF' });
      } else {
        setError('Sharing is not available on this device — the PDF was generated but could not be saved.');
      }
    } catch (err) {
      setError(`Could not generate the PDF: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setExporting(false);
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
    if (!userId) return;
    setDeleting(true);
    setError(null);

    const { error: deleteError } = await supabase.from('customer_wellness').delete().eq('user_id', userId);

    setDeleting(false);

    if (deleteError) {
      setError(deleteError.message || 'Could not delete your health profile.');
      return;
    }
    setProfile(emptyProfile);
    setSavedNotice(true);
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
          title="Export as PDF"
          onPress={handleExportPdf}
          loading={exporting}
          disabled={saving || deleting}
          icon="document-text-outline"
          size="lg"
          style={{ marginTop: Spacing.md }}
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
