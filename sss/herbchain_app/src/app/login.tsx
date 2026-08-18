import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '@/theme';
import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import Icon from '@/components/Icon';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { useToastStore } from '@/store/toastStore';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const loginAsGuest = useAuthStore((s) => s.loginAsGuest);

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (otpMode) return; // OTP login isn't wired to a backend yet — see note below.
    if (!emailOrPhone.trim() || !password) {
      setError('Enter your email or phone and password.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await authService.login(emailOrPhone, password);

    setSubmitting(false);

    if (!result.ok) {
      setError(result.error ?? 'Sign in failed. Please try again.');
      return;
    }

    await login(result.user!, result.tokens!);
    useToastStore.getState().show(`Welcome back, ${result.user!.name.split(' ')[0]}!`, 'success');
    router.replace('/(tabs)');
  };

  const handleGuest = () => {
    loginAsGuest();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header Branding */}
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Icon name="leaf" size={24} color={Colors.gold} />
            </View>
            <Text style={styles.brandName}>
              AYUTRACE<Text style={styles.goldPlus}>+</Text>
            </Text>
          </View>

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to access saved products, history, and alerts</Text>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email or Phone</Text>
              <View style={styles.inputWrapper}>
                <Icon name="mail-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter email or phone number"
                  value={emailOrPhone}
                  onChangeText={setEmailOrPhone}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {!otpMode ? (
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Password</Text>
                  <TouchableOpacity onPress={() => alert('Password reset is not available yet. Please contact support.')}>
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputWrapper}>
                  <Icon name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter password"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>OTP Verification Code</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="key-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 6-digit OTP (e.g. 123456)"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={false}
                  />
                </View>
                <Text style={styles.otpUnavailableText}>
                  OTP sign-in isn&apos;t available yet — please sign in with your password.
                </Text>
              </View>
            )}

            {error ? (
              <View style={styles.errorBox}>
                <Icon name="alert-circle" size={16} color={Colors.error} />
                <Text style={styles.errorBoxText}>{error}</Text>
              </View>
            ) : null}

            <PrimaryButton
              title={otpMode ? 'Verify OTP & Sign In' : 'Sign In'}
              onPress={handleSignIn}
              loading={submitting}
              disabled={otpMode}
              size="lg"
              style={{ marginTop: Spacing.md }}
            />

            <TouchableOpacity
              style={styles.otpToggleBtn}
              onPress={() => setOtpMode(!otpMode)}
            >
              <Text style={styles.otpToggleText}>
                {otpMode ? 'Sign in with Password' : 'Sign in with OTP'}
              </Text>
            </TouchableOpacity>

            <View style={styles.registerRow}>
              <Text style={styles.noAccountText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.createAccountText}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Guest Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Guest Action */}
          <SecondaryButton
            title="Continue as Guest"
            onPress={handleGuest}
            icon="person-outline"
            size="lg"
          />

          <View style={styles.guestNoteBox}>
            <Icon name="information-circle-outline" size={16} color={Colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.guestNoteText}>
              Guest users can scan and verify products but must log in to save products, history, and alerts.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  brandName: {
    fontFamily: Fonts.family.serifSemiBold,
    fontSize: Fonts.size.xl,
    color: Colors.primary,
  },
  goldPlus: {
    color: Colors.gold,
  },
  title: {
    fontFamily: Fonts.family.serifSemiBold,
    fontSize: Fonts.size['2xl'],
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  formContainer: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    ...Shadow.sm,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontFamily: Fonts.family.medium,
    fontWeight: Fonts.weight.medium,
    fontSize: Fonts.size.sm,
    color: Colors.text,
    marginBottom: 6,
  },
  forgotText: {
    fontFamily: Fonts.family.semiBold,
    fontWeight: Fonts.weight.semiBold,
    fontSize: Fonts.size.xs + 1,
    color: Colors.green,
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
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.sm + 1,
    color: Colors.text,
  },
  otpUnavailableText: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: Colors.errorContainer,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  errorBoxText: {
    flex: 1,
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs + 1,
    color: Colors.onErrorContainer,
  },
  otpToggleBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  otpToggleText: {
    fontFamily: Fonts.family.semiBold,
    fontWeight: Fonts.weight.semiBold,
    fontSize: Fonts.size.sm,
    color: Colors.green,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  noAccountText: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
  },
  createAccountText: {
    fontFamily: Fonts.family.bold,
    fontWeight: Fonts.weight.bold,
    fontSize: Fonts.size.sm,
    color: Colors.primary,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerLabel: {
    fontFamily: Fonts.family.medium,
    fontWeight: Fonts.weight.medium,
    fontSize: Fonts.size.xs,
    color: Colors.textMuted,
    marginHorizontal: Spacing.md,
  },
  guestNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGreen + '80',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  guestNoteText: {
    flex: 1,
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs,
    color: Colors.primary,
    lineHeight: 16,
  },
});
