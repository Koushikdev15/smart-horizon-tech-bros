import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Type, Spacing, BorderRadius, Shadow } from '@/theme';
import Icon from '@/components/Icon';
import BotanicalBackdrop from '@/components/BotanicalBackdrop';
import FormField from '@/components/forms/FormField';
import SelectField from '@/components/forms/SelectField';
import StepProgress from '@/components/forms/StepProgress';
import { OptionGroup, ChipMultiSelect, ConsentCheckbox } from '@/components/forms/Selection';
import ExactLocationField from '@/features/registration/LocationField';
import {
  REGISTRATION_STEPS,
  OCCUPATIONS,
  RELIGIONS,
  STATES,
  ALLERGY_OPTIONS,
  CONDITION_OPTIONS,
  MEDICAL_HISTORY_OPTIONS,
  CURRENT_MEDICATION_OPTIONS,
  TRI_STATE_OPTIONS,
  ALLERGY_TRI_STATE,
  CONDITION_TRI_STATE,
} from '@/features/registration/constants';
import {
  validateName,
  validateEmail,
  validateMobile,
  validatePassword,
  validateConfirmPassword,
  validateDob,
  formatDobInput,
  validateAadhaar,
  validatePan,
  passwordStrength,
} from '@/lib/validation';
import {
  registrationService,
  computeProfileCompletion,
  type RegistrationDraft,
  type RegistrationResult,
} from '@/services/registrationService';
import { supabase } from '@/lib/supabase';
import type { TriState } from '@/types';

type Errors = Record<string, string | undefined>;

/**
 * iOS has no OS-level keyboard resize, so it needs KeyboardAvoidingView.
 * Android already resizes via windowSoftInputMode="adjustResize" (Expo
 * default) — layering KeyboardAvoidingView's own listener-driven resize on
 * top of that fights the OS for every keyboard height change (e.g. Gboard's
 * predictive-text strip growing/shrinking per keystroke), which is what was
 * causing focus to flicker between fields while typing on Android.
 */
const KeyboardWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  Platform.OS === 'ios' ? (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      {children}
    </KeyboardAvoidingView>
  ) : (
    <View style={{ flex: 1 }}>{children}</View>
  );

const emptyDraft: RegistrationDraft = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  language: 'en',
  dateOfBirth: '',
  aadhaar: '',
  pan: '',
  occupation: '',
  religion: '',
  region: '',
  address: '',
  coordinates: undefined,
  wellness: {
    hasAllergies: 'undisclosed',
    allergies: [],
    hasCurrentHealthIssues: 'undisclosed',
    hasExistingConditions: 'undisclosed',
    conditions: [],
    medicalHistoryTags: [],
    currentMedicationTags: [],
  },
  wellnessProvided: false,
  consent: {
    terms: false,
    privacy: false,
    storeHealthData: false,
    personalizedAlerts: false,
  },
};

export default function RegisterScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<RegistrationDraft>(emptyDraft);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Once the account/profile wizard is submitted, a 6-digit code is emailed
  // to draft.email — this screen switches to asking for it before the
  // profile (and Ayurvedic ID) actually get created.
  const [phase, setPhase] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const set = <K extends keyof RegistrationDraft>(key: K, value: RegistrationDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const setWellness = <K extends keyof RegistrationDraft['wellness']>(
    key: K,
    value: RegistrationDraft['wellness'][K],
  ) => setDraft((d) => ({ ...d, wellnessProvided: true, wellness: { ...d.wellness, [key]: value } }));

  const strength = useMemo(() => passwordStrength(draft.password), [draft.password]);

  /* ───────────────────────── validation per step ───────────────────────── */

  function validateStep(index: number): boolean {
    const e: Errors = {};

    if (index === 0) {
      e.fullName = validateName(draft.fullName);
      e.email = validateEmail(draft.email);
      e.phone = validateMobile(draft.phone);
      e.password = validatePassword(draft.password);
      e.confirmPassword = validateConfirmPassword(draft.password, confirmPassword);
    }

    if (index === 1) {
      e.dateOfBirth = validateDob(draft.dateOfBirth);
      e.aadhaar = validateAadhaar(draft.aadhaar);
      e.pan = validatePan(draft.pan);
    }

    if (index === 2) {
      if (!draft.region) e.region = 'Please select your state';
      if (!draft.address.trim()) e.address = 'Full address is required';
    }

    // Step 3 (Wellness) is entirely optional — nothing to validate.

    if (index === 4) {
      if (!draft.consent.terms) e.terms = 'required';
      if (!draft.consent.privacy) e.privacy = 'required';
    }

    const cleaned = Object.fromEntries(Object.entries(e).filter(([, v]) => v)) as Errors;
    setErrors(cleaned);
    return Object.keys(cleaned).length === 0;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setErrors({});
    if (step < REGISTRATION_STEPS.length - 1) setStep(step + 1);
  }

  function goBack() {
    setErrors({});
    if (step === 0) router.back();
    else setStep(step - 1);
  }

  function skipWellness() {
    setDraft((d) => ({ ...d, wellnessProvided: false, wellness: emptyDraft.wellness }));
    setStep(4);
  }

  /* ───────────────────────── submission ───────────────────────── */

  async function submit() {
    if (!validateStep(4)) return;
    setSubmitting(true);
    setSubmitError(null);

    const result = await registrationService.startRegistration(draft);

    setSubmitting(false);

    if (!result.ok) {
      setSubmitError(result.error ?? 'Registration failed. Please try again.');
      return;
    }

    if (result.needsOtp) {
      setPhase('otp');
      return;
    }

    // Rare path: the project has email confirmation disabled, so a session
    // (and the finished profile) came back immediately — nothing to verify.
    finishRegistration(result);
  }

  async function submitOtp() {
    if (!otp.trim()) {
      setOtpError('Enter the 6-digit code we emailed you.');
      return;
    }
    setSubmitting(true);
    setOtpError(null);

    const result = await registrationService.verifySignupOtp(draft, otp.trim());

    setSubmitting(false);

    if (!result.ok) {
      setOtpError(result.error ?? 'Invalid or expired code. Please try again.');
      return;
    }

    finishRegistration(result);
  }

  async function resendOtp() {
    setResending(true);
    setOtpError(null);
    const result = await registrationService.resendSignupOtp(draft.email);
    setResending(false);
    if (!result.ok) setOtpError(result.error ?? 'Could not resend the code. Please try again.');
  }

  async function finishRegistration(result: { user?: RegistrationResult['user']; error?: string }) {
    // The account is created, but the user should land on the login screen
    // and sign in for themselves (with the Ayurvedic ID they're about to
    // copy) rather than being auto-signed-in — so the session verifyOtp
    // just established gets cleared here rather than kept.
    await supabase.auth.signOut();

    router.replace({
      pathname: '/registration-complete',
      params: {
        completion: String(computeProfileCompletion(draft)),
        wellness: draft.wellnessProvided ? '1' : '0',
        warning: result.error ?? '',
        ayurvedicId: result.user!.ayurvedicId ?? '',
      },
    });
  }

  const isLast = step === REGISTRATION_STEPS.length - 1;

  /* ───────────────────────── OTP step ───────────────────────── */

  function renderOtpStep() {
    return (
      <>
        <View style={styles.privacyCard}>
          <Icon name="mail-open-outline" size={20} color={Colors.onTertiaryContainer} />
          <Text style={styles.privacyTitle}>Verify Your Email</Text>
          <Text style={styles.privacyBody}>
            We sent a 6-digit code to <Text style={styles.emailHighlight}>{draft.email}</Text>. Enter it
            below to finish creating your account.
          </Text>
        </View>

        <FormField
          scrollViewRef={scrollRef}
          label="Verification Code"
          icon="key-outline"
          value={otp}
          onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
          placeholder="123456"
          keyboardType="number-pad"
          maxLength={6}
          error={otpError ?? undefined}
        />

        <TouchableOpacity onPress={resendOtp} disabled={resending} style={{ marginTop: Spacing.sm }}>
          <Text style={styles.secondaryBtnText}>{resending ? 'Resending…' : "Didn't get a code? Resend"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setPhase('form');
            setOtp('');
            setOtpError(null);
          }}
          style={{ marginTop: Spacing.sm }}
        >
          <Text style={styles.secondaryBtnText}>Wrong email? Go back and edit it</Text>
        </TouchableOpacity>
      </>
    );
  }

  /* ───────────────────────── step bodies ───────────────────────── */

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <>
            <FormField
              scrollViewRef={scrollRef}
              key="field-fullName"
              label="Full Name"
              icon="person-outline"
              value={draft.fullName}
              onChangeText={(v) => set('fullName', v)}
              placeholder="As printed on your ID"
              autoCapitalize="words"
              error={errors.fullName}
            />
            <FormField
              scrollViewRef={scrollRef}
              key="field-phone"
              label="Mobile Number"
              icon="call-outline"
              value={draft.phone}
              onChangeText={(v) => set('phone', v)}
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
              maxLength={14}
              error={errors.phone}
            />
            <FormField
              scrollViewRef={scrollRef}
              key="field-email"
              label="Email Address"
              icon="mail-outline"
              value={draft.email}
              onChangeText={(v) => set('email', v)}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            <FormField
              scrollViewRef={scrollRef}
              key="field-password"
              label="Password"
              icon="lock-closed-outline"
              value={draft.password}
              onChangeText={(v) => set('password', v)}
              placeholder="At least 8 characters"
              password
              autoCapitalize="none"
              error={errors.password}
            />
            {draft.password ? (
              <View key="field-strength" style={styles.strengthWrap}>
                <View style={styles.strengthTrack}>
                  <View
                    style={[
                      styles.strengthFill,
                      { width: `${(strength.score / 4) * 100}%` },
                      strength.score >= 3
                        ? styles.strengthStrong
                        : strength.score === 2
                          ? styles.strengthFair
                          : styles.strengthWeak,
                    ]}
                  />
                </View>
                <Text style={styles.strengthLabel}>{strength.label}</Text>
              </View>
            ) : null}
            <FormField
              scrollViewRef={scrollRef}
              key="field-confirmPassword"
              label="Confirm Password"
              icon="shield-checkmark-outline"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter your password"
              password
              autoCapitalize="none"
              error={errors.confirmPassword}
            />
          </>
        );

      case 1:
        return (
          <>
            <FormField
              scrollViewRef={scrollRef}
              label="Date of Birth"
              icon="calendar-outline"
              value={draft.dateOfBirth}
              onChangeText={(v) => set('dateOfBirth', formatDobInput(v))}
              placeholder="DD/MM/YYYY"
              keyboardType="number-pad"
              maxLength={10}
              hint="You must be 18 or older to register."
              error={errors.dateOfBirth}
            />
            <FormField
              scrollViewRef={scrollRef}
              label="Aadhaar Number"
              icon="card-outline"
              value={draft.aadhaar}
              onChangeText={(v) => set('aadhaar', v)}
              placeholder="12-digit Aadhaar"
              keyboardType="number-pad"
              maxLength={14}
              secure
              hint="Only the last 4 digits are stored on our servers."
              error={errors.aadhaar}
            />
            <FormField
              scrollViewRef={scrollRef}
              label="PAN Number"
              icon="document-text-outline"
              value={draft.pan}
              onChangeText={(v) => set('pan', v.toUpperCase())}
              placeholder="ABCDE1234F"
              autoCapitalize="characters"
              maxLength={10}
              secure
              hint="Only the last 4 characters are stored."
              error={errors.pan}
            />
            <SelectField
              label="Occupation"
              icon="briefcase-outline"
              value={draft.occupation}
              options={OCCUPATIONS}
              onSelect={(v) => set('occupation', v)}
              optional
            />
            <SelectField
              label="Religion"
              icon="people-outline"
              value={draft.religion}
              options={RELIGIONS}
              onSelect={(v) => set('religion', v)}
              optional
            />
          </>
        );

      case 2:
        return (
          <>
            <SelectField
              label="Region / State"
              icon="map-outline"
              value={draft.region}
              options={STATES}
              onSelect={(v) => set('region', v)}
              error={errors.region}
            />
            <FormField
              scrollViewRef={scrollRef}
              label="Full Address"
              icon="home-outline"
              value={draft.address}
              onChangeText={(v) => set('address', v)}
              placeholder="House / street, area, city, PIN code"
              multiline
              error={errors.address}
            />
            <ExactLocationField
              value={draft.coordinates}
              onChange={(coords) => set('coordinates', coords)}
            />
          </>
        );

      case 3:
        return (
          <>
            <View style={styles.noticeCard}>
              <Icon name="shield-checkmark" size={18} color={Colors.onSecondaryContainer} />
              <Text style={styles.noticeText}>
                Every field here is optional. Share only what you&apos;re comfortable with — you can
                skip this step entirely.
              </Text>
            </View>

            <OptionGroup
              label="Do you have any allergies?"
              options={ALLERGY_TRI_STATE}
              value={draft.wellness.hasAllergies}
              onSelect={(v) => setWellness('hasAllergies', v as TriState)}
            />
            {draft.wellness.hasAllergies === 'yes' && (
              <>
                <ChipMultiSelect
                  label="Select your allergies"
                  options={ALLERGY_OPTIONS}
                  selected={draft.wellness.allergies}
                  onToggle={(v) =>
                    setWellness(
                      'allergies',
                      draft.wellness.allergies.includes(v)
                        ? draft.wellness.allergies.filter((a) => a !== v)
                        : [...draft.wellness.allergies, v],
                    )
                  }
                />
                <FormField
              scrollViewRef={scrollRef}
                  label="Allergy details"
                  value={draft.wellness.allergyNotes ?? ''}
                  onChangeText={(v) => setWellness('allergyNotes', v)}
                  placeholder="Anything specific we should know?"
                  multiline
                  optional
                />
              </>
            )}

            <OptionGroup
              label="Do you have any current health issues?"
              options={TRI_STATE_OPTIONS}
              value={draft.wellness.hasCurrentHealthIssues}
              onSelect={(v) => setWellness('hasCurrentHealthIssues', v as TriState)}
            />
            {draft.wellness.hasCurrentHealthIssues === 'yes' && (
              <FormField
              scrollViewRef={scrollRef}
                label="Describe your health issue"
                value={draft.wellness.currentHealthIssues ?? ''}
                onChangeText={(v) => setWellness('currentHealthIssues', v)}
                placeholder="Briefly describe what you're experiencing"
                multiline
                optional
              />
            )}

            <OptionGroup
              label="Do you have any existing health conditions?"
              options={CONDITION_TRI_STATE}
              value={draft.wellness.hasExistingConditions}
              onSelect={(v) => setWellness('hasExistingConditions', v as TriState)}
            />
            {draft.wellness.hasExistingConditions === 'yes' && (
              <ChipMultiSelect
                label="Select your conditions"
                options={CONDITION_OPTIONS}
                selected={draft.wellness.conditions}
                onToggle={(v) =>
                  setWellness(
                    'conditions',
                    draft.wellness.conditions.includes(v)
                      ? draft.wellness.conditions.filter((c) => c !== v)
                      : [...draft.wellness.conditions, v],
                  )
                }
              />
            )}

            <ChipMultiSelect
              label="Medical History"
              options={MEDICAL_HISTORY_OPTIONS}
              selected={draft.wellness.medicalHistoryTags}
              onToggle={(v) =>
                setWellness(
                  'medicalHistoryTags',
                  draft.wellness.medicalHistoryTags.includes(v)
                    ? draft.wellness.medicalHistoryTags.filter((t) => t !== v)
                    : [...draft.wellness.medicalHistoryTags, v],
                )
              }
            />
            <FormField
              scrollViewRef={scrollRef}
              label="Further details"
              value={draft.wellness.medicalHistory ?? ''}
              onChangeText={(v) => setWellness('medicalHistory', v)}
              placeholder="Add any specifics not covered above"
              multiline
              optional
            />

            <ChipMultiSelect
              label="Current Medications"
              options={CURRENT_MEDICATION_OPTIONS}
              selected={draft.wellness.currentMedicationTags}
              onToggle={(v) =>
                setWellness(
                  'currentMedicationTags',
                  draft.wellness.currentMedicationTags.includes(v)
                    ? draft.wellness.currentMedicationTags.filter((t) => t !== v)
                    : [...draft.wellness.currentMedicationTags, v],
                )
              }
            />
            <FormField
              scrollViewRef={scrollRef}
              label="Further details"
              value={draft.wellness.currentMedications ?? ''}
              onChangeText={(v) => setWellness('currentMedications', v)}
              placeholder="Specific medicine names, dosage, or supplements"
              multiline
              optional
            />
          </>
        );

      case 4:
        return (
          <>
            <View style={styles.privacyCard}>
              <Icon name="lock-closed" size={20} color={Colors.onTertiaryContainer} />
              <Text style={styles.privacyTitle}>Your Privacy Matters</Text>
              <Text style={styles.privacyBody}>
                Your personal and wellness information is sensitive. It will only be used according
                to the permissions you provide.
              </Text>
            </View>

            <ConsentCheckbox
              label="I agree to the Terms & Conditions"
              checked={draft.consent.terms}
              onToggle={() => set('consent', { ...draft.consent, terms: !draft.consent.terms })}
              required
              error={Boolean(errors.terms)}
            />
            <ConsentCheckbox
              label="I agree to the Privacy Policy"
              checked={draft.consent.privacy}
              onToggle={() => set('consent', { ...draft.consent, privacy: !draft.consent.privacy })}
              required
              error={Boolean(errors.privacy)}
            />
            <View style={styles.consentDivider} />
            <ConsentCheckbox
              label="Store my health and allergy information"
              description="Without this, your wellness answers are discarded and never leave your device."
              checked={draft.consent.storeHealthData}
              onToggle={() =>
                set('consent', { ...draft.consent, storeHealthData: !draft.consent.storeHealthData })
              }
            />
            <ConsentCheckbox
              label="Send me personalized safety and product alerts"
              description="Recall notices and expiry reminders for products you've scanned."
              checked={draft.consent.personalizedAlerts}
              onToggle={() =>
                set('consent', {
                  ...draft.consent,
                  personalizedAlerts: !draft.consent.personalizedAlerts,
                })
              }
            />

            {(errors.terms || errors.privacy) && (
              <Text style={styles.consentError}>
                Please accept the Terms & Conditions and Privacy Policy to continue.
              </Text>
            )}

            {draft.wellnessProvided && !draft.consent.storeHealthData && (
              <View style={styles.warnCard}>
                <Icon name="information-circle" size={16} color={Colors.onTertiaryFixedVariant} />
                <Text style={styles.warnText}>
                  You entered wellness details but haven&apos;t consented to storing them. They
                  won&apos;t be saved.
                </Text>
              </View>
            )}

            {submitError ? (
              <View style={styles.errorCard}>
                <Icon name="alert-circle" size={16} color={Colors.error} />
                <Text style={styles.errorCardText}>{submitError}</Text>
              </View>
            ) : null}
          </>
        );

      default:
        return null;
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <BotanicalBackdrop />

      <KeyboardWrapper>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={phase === 'otp' ? () => setPhase('form') : goBack}
            accessibilityLabel="Go back"
          >
            <Icon name="arrow-back" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>
            {phase === 'otp' ? 'Verify Your Email' : step === 3 ? 'Your Wellness Profile' : 'Create Your AyurTrace+ Account'}
          </Text>
          <Text style={styles.subtitle}>
            {phase === 'otp'
              ? 'One last step before your profile and Ayurvedic ID are created.'
              : step === 3
                ? 'This information helps us provide relevant safety and product information.'
                : 'Create your profile to receive personalized product information, safety alerts and verification updates.'}
          </Text>

          {phase === 'form' && <StepProgress steps={[...REGISTRATION_STEPS]} current={step} />}

          <View style={styles.card}>{phase === 'otp' ? renderOtpStep() : renderStep()}</View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
              onPress={phase === 'otp' ? submitOtp : isLast ? submit : goNext}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.onPrimary} />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {phase === 'otp' ? 'Verify & Create Account' : isLast ? 'Create My Profile' : 'Continue'}
                </Text>
              )}
            </TouchableOpacity>

            {step === 3 && (
              <TouchableOpacity style={styles.secondaryBtn} onPress={skipWellness}>
                <Text style={styles.secondaryBtnText}>Skip Health Profile</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  topBar: { paddingHorizontal: Spacing.gutter, paddingTop: Spacing.sm },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Generous bottom padding so the last field/button in a long step can
  // always be scrolled well above the keyboard rather than staying pinned
  // right at its edge — plain padding, not a native keyboard-avoiding lib,
  // to stay compatible with Expo Go.
  scroll: { paddingHorizontal: Spacing.gutter, paddingTop: Spacing.base, paddingBottom: 320 },
  title: { ...Type.headlineLgMobile, color: Colors.primary },
  subtitle: { ...Type.bodyMd, color: Colors.onSurfaceVariant, marginTop: Spacing.sm, marginBottom: Spacing.xl },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    ...Shadow.md,
  },
  strengthWrap: { marginTop: -Spacing.sm, marginBottom: Spacing.base, gap: Spacing.sm },
  strengthTrack: { height: 4, borderRadius: 2, backgroundColor: Colors.surfaceContainerHigh, overflow: 'hidden' },
  strengthFill: { height: 4, borderRadius: 2 },
  strengthWeak: { backgroundColor: Colors.error },
  strengthFair: { backgroundColor: Colors.onTertiaryContainer },
  strengthStrong: { backgroundColor: Colors.secondary },
  strengthLabel: { ...Type.bodySm, color: Colors.onSurfaceVariant },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: Colors.secondaryContainer,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
  },
  noticeText: { ...Type.bodySm, color: Colors.onSecondaryContainer, flex: 1 },
  privacyCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.onTertiaryContainer + '40',
  },
  privacyTitle: { ...Type.headlineSm, color: Colors.primary, marginTop: Spacing.sm },
  privacyBody: { ...Type.bodySm, color: Colors.onSurfaceVariant, marginTop: Spacing.xs },
  emailHighlight: { fontWeight: '700', color: Colors.primary },
  consentDivider: {
    height: 1,
    backgroundColor: Colors.outlineVariant,
    opacity: 0.6,
    marginVertical: Spacing.md,
  },
  consentError: { ...Type.bodySm, color: Colors.error, marginTop: Spacing.sm },
  warnCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.tertiaryFixed,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.base,
  },
  warnText: { ...Type.bodySm, color: Colors.onTertiaryFixedVariant, flex: 1 },
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
  actions: { marginTop: Spacing.lg, gap: Spacing.md },
  primaryBtn: {
    minHeight: 54,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { ...Type.labelMd, fontSize: 16, color: Colors.onPrimary },
  secondaryBtn: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { ...Type.labelMd, color: Colors.primaryContainer },
});
