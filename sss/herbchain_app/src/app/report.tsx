import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, BorderRadius, Shadow } from '@/theme';
import { AppHeader } from '@/components/Header';
import { PrimaryButton } from '@/components/Buttons';
import Icon from '@/components/Icon';
import { ApiError } from '@/lib/api';
import { complaintService, COMPLAINT_ISSUE_TYPES } from '@/services/complaintService';
import { useAuthStore } from '@/store/authStore';

const ISSUE_TYPES = COMPLAINT_ISSUE_TYPES;
const ATTACHED_BATCH_ID = 'AYUR-ASH-2026-000458';

export default function ReportIssueScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isGuest = useAuthStore((s) => s.isGuest);

  const [selectedIssue, setSelectedIssue] = useState<(typeof ISSUE_TYPES)[number]>(ISSUE_TYPES[0]);
  const [description, setDescription] = useState('');
  const [photoAttached, setPhotoAttached] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [complaintId, setComplaintId] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!isAuthenticated || isGuest) {
      setSubmitError('Sign in to submit a report.');
      return;
    }
    if (!description.trim()) {
      alert('Please provide a brief description of the issue.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await complaintService.submit({
        issueType: selectedIssue,
        description: description.trim(),
        batchId: ATTACHED_BATCH_ID,
      });
      setComplaintId(result._id);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Could not submit your report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader showBack onBackPress={() => router.back()} title="Report Submitted" />
        <View style={styles.successContent}>
          <View style={styles.successIconBadge}>
            <Icon name="checkmark-circle" size={54} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Report Submitted Successfully</Text>
          <Text style={styles.successDesc}>
            Thank you for helping keep the Ayurvedic supply chain safe. Our verification team has logged your report
            {complaintId ? ` (#${complaintId.slice(-8).toUpperCase()})` : ''} and attached your scanned batch details.
          </Text>

          <PrimaryButton
            title="Back to Home"
            onPress={() => router.replace('/(tabs)')}
            size="lg"
            style={{ marginTop: Spacing.xl }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader showBack onBackPress={() => router.back()} title="Report Product Issue" />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Auto Attached Batch Info Box */}
        <View style={styles.attachedBox}>
          <Icon name="attach-outline" size={18} color={Colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.attachedText}>
            Auto-attached Batch: <Text style={{ fontFamily: Fonts.family.bold }}>{ATTACHED_BATCH_ID}</Text>
          </Text>
        </View>

        {submitError ? (
          <>
            <View style={styles.errorBox}>
              <Icon name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.errorBoxText}>{submitError}</Text>
            </View>
            {(!isAuthenticated || isGuest) && (
              <TouchableOpacity onPress={() => router.push('/login')} style={{ marginBottom: Spacing.md }}>
                <Text style={[styles.attachedText, { fontFamily: Fonts.family.bold }]}>Sign In →</Text>
              </TouchableOpacity>
            )}
          </>
        ) : null}

        {/* Issue Type Selector */}
        <View style={[styles.card, Shadow.sm]}>
          <Text style={styles.label}>Select Issue Type</Text>
          <View style={styles.issueGrid}>
            {ISSUE_TYPES.map((type) => {
              const active = selectedIssue === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.issueChip, active && styles.issueChipActive]}
                  onPress={() => setSelectedIssue(type)}
                >
                  <Text style={[styles.issueChipText, active && styles.issueChipTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Description */}
          <Text style={[styles.label, { marginTop: Spacing.md }]}>Description</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder="Describe the issue, packaging defect, or seller details..."
            value={description}
            onChangeText={setDescription}
            placeholderTextColor={Colors.textMuted}
          />

          {/* Photo Upload Simulator */}
          <Text style={[styles.label, { marginTop: Spacing.md }]}>Photo Upload</Text>
          <TouchableOpacity
            style={[styles.photoBox, photoAttached && styles.photoBoxAttached]}
            onPress={() => setPhotoAttached(!photoAttached)}
          >
            <Icon
              name={photoAttached ? 'checkmark-circle' : 'camera-outline'}
              size={24}
              color={photoAttached ? Colors.success : Colors.primary}
            />
            <Text style={styles.photoText}>
              {photoAttached ? 'Packaging Photo Attached ✓' : 'Upload Packaging or Product Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        <PrimaryButton
          title={submitting ? 'Submitting…' : 'Submit Report'}
          onPress={handleSubmit}
          loading={submitting}
          icon="paper-plane-outline"
          size="lg"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: 320,
  },
  attachedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGreen,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginVertical: Spacing.md,
  },
  attachedText: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.xs + 1,
    color: Colors.primary,
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
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  label: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.sm,
    color: Colors.text,
    marginBottom: 8,
  },
  issueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  issueChip: {
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
  },
  issueChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  issueChipText: {
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.size.xs,
    color: Colors.textSecondary,
  },
  issueChipTextActive: {
    color: Colors.white,
    fontFamily: Fonts.family.bold,
  },
  textArea: {
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.sm,
    color: Colors.text,
    textAlignVertical: 'top',
    height: 100,
  },
  photoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cream,
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  photoBoxAttached: {
    backgroundColor: Colors.lightGreen,
    borderColor: Colors.success,
    borderStyle: 'solid',
  },
  photoText: {
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.size.xs + 1,
    color: Colors.primary,
    marginLeft: 8,
  },
  successContent: {
    flex: 1,
    padding: Spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  successTitle: {
    fontFamily: Fonts.family.serifSemiBold,
    fontSize: Fonts.size.xl,
    color: Colors.text,
    textAlign: 'center',
  },
  successDesc: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
});
