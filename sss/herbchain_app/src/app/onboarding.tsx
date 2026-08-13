import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Fonts, Spacing, BorderRadius } from '@/theme';
import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import Icon, { IconName } from '@/components/Icon';
import { useAuthStore } from '@/store/authStore';

interface OnboardingStep {
  id: number;
  title: string;
  desc: string;
  icon: IconName;
}

const STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: 'Know Your Ayurveda',
    desc: 'Verify the authenticity and source of Ayurvedic products.',
    icon: 'shield-checkmark',
  },
  {
    id: 2,
    title: 'Trace Every Ingredient',
    desc: 'Follow medicinal ingredients from source to final product.',
    icon: 'leaf',
  },
  {
    id: 3,
    title: 'Buy With Confidence',
    desc: 'Understand authenticity, laboratory verification, and product history before using a product.',
    icon: 'ribbon',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const setOnboardingSeen = useAuthStore((s) => s.setOnboardingSeen);

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  const handleFinish = () => {
    setOnboardingSeen();
    router.replace('/login');
  };

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        {!isLast ? (
          <TouchableOpacity onPress={handleFinish}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Icon name={step.icon} size={64} color={Colors.primary} />
        </View>

        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.desc}>{step.desc}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {STEPS.map((s, idx) => (
            <View
              key={s.id}
              style={[
                styles.dot,
                idx === currentStep && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <PrimaryButton
          title={isLast ? 'Get Started' : 'Next'}
          onPress={handleNext}
          icon={isLast ? 'arrow-forward' : undefined}
          iconPosition="right"
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    height: 40,
  },
  skipText: {
    fontFamily: Fonts.family.semiBold,
    fontWeight: Fonts.weight.semiBold,
    fontSize: Fonts.size.sm + 1,
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['2xl'],
    borderWidth: 2,
    borderColor: Colors.green + '30',
  },
  title: {
    fontFamily: Fonts.family.serifSemiBold,
    fontSize: Fonts.size['2xl'],
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  desc: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['2xl'],
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
});
