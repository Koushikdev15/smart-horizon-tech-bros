import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '@/theme';
import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import Icon from '@/components/Icon';
import { supabase } from '@/lib/supabase';
import { mapAppLoginRow, type AppLoginRow } from '@/services/authService';
import { validatePassword } from '@/lib/validation';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';

/**
 * Forgot-password recovery: sign in with Google (linked by matching, verified
 * email to the account's original email/password identity — see the Supabase
 * dashboard setup notes in the rollout plan), then set a new password on that
 * same account. This does NOT make Google a general sign-in method — the
 * main login screen only accepts Ayurvedic ID + email + password.
 */
type Step = 'start' | 'set-password';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [step, setStep] = useState<Step>('start');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<AppLoginRow | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    if (webClientId) {
      GoogleSignin.configure({ webClientId });
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    setError(null);

    try {
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices();
      }
      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response) || !response.data.idToken) {
        setSubmitting(false);
        return; // user cancelled — no error to show
      }

      const { data, error: signInError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.data.idToken,
      });

      if (signInError || !data.session) {
        setError('Google sign-in failed. Please try again.');
        setSubmitting(false);
        return;
      }

      const { data: row, error: profileError } = await supabase
        .from('app_login')
        .select('*')
        .eq('id', data.session.user.id)
        .maybeSingle();

      if (profileError || !row) {
        await supabase.auth.signOut();
        setError(
          "No AyurTrace+ account found for this Google email. Make sure you're using the same email you registered with."
        );
        setSubmitting(false);
        return;
      }

      setProfile(row as AppLoginRow);
      setStep('set-password');
    } catch (err) {
      if (isErrorWithCode(err) && err.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled — no error to show
      } else {
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetPassword = async () => {
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

    setSubmitting(false);

    if (updateError) {
      setError(updateError.message || 'Could not set a new password. Please try again.');
      return;
    }

    login(mapAppLoginRow(profile!));
    useToastStore.getState().show('Password updated. Welcome back!', 'success');
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Reset Password</Text>
      </View>

      {step === 'start' ? (
        <View style={styles.body}>
          <Text style={styles.subtitle}>
            Sign in with the Google account matching your AyurTrace+ email to verify it&apos;s you,
            then set a new password.
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Icon name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.errorBoxText}>{error}</Text>
            </View>
          ) : null}

          <SecondaryButton
            title="Continue with Google"
            onPress={handleGoogleSignIn}
            icon="logo-google"
            size="lg"
            loading={submitting}
          />
        </View>
      ) : (
        <View style={styles.body}>
          <Text style={styles.subtitle}>
            Verified as <Text style={styles.emailText}>{profile?.email}</Text>. Choose a new password.
          </Text>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.inputWrapper}>
                <Icon name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  secureTextEntry={!showPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <Icon name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter new password"
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Icon name="alert-circle" size={16} color={Colors.error} />
                <Text style={styles.errorBoxText}>{error}</Text>
              </View>
            ) : null}

            <PrimaryButton
              title="Set New Password"
              onPress={handleSetPassword}
              loading={submitting}
              size="lg"
              style={{ marginTop: Spacing.md }}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  backBtn: { padding: 4, marginRight: Spacing.sm },
  title: {
    fontFamily: Fonts.family.serifSemiBold,
    fontSize: Fonts.size.xl,
    color: Colors.text,
  },
  body: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  subtitle: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  emailText: { fontFamily: Fonts.family.semiBold, color: Colors.primary },
  formContainer: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    ...Shadow.sm,
  },
  inputGroup: { marginBottom: Spacing.md },
  label: {
    fontFamily: Fonts.family.medium,
    fontWeight: Fonts.weight.medium,
    fontSize: Fonts.size.sm,
    color: Colors.text,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 48,
    backgroundColor: Colors.cream,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: {
    flex: 1,
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.sm + 1,
    color: Colors.text,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: Colors.errorContainer,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorBoxText: {
    flex: 1,
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs + 1,
    color: Colors.onErrorContainer,
  },
});
