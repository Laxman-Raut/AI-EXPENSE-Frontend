import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import GradientBackground from '../../components/common/GradientBackground';
import GlassCard from '../../components/Card/GlassCard';
import InputField from '../../components/Input/InputField';
import PrimaryButton from '../../components/Button/PrimaryButton';
import Header from '../../components/Header/Header';
import { Colors, Typography, Spacing } from '../../theme';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
});

const ForgotPasswordScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    // Simulate reset request
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);
    setSuccess(true);
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <Header showBackButton title="" onBackPress={() => navigation.goBack()} />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>

            {/* Header Icon */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Icon name="key-outline" size={48} color="#FFFFFF" />
              </View>
              <Text style={styles.title}>Forgot Password?</Text>
              <Text style={styles.subtitle}>
                No worries! Enter your email and we'll send you recovery instructions.
              </Text>
            </View>

            {success ? (
              <GlassCard style={styles.successCard}>
                <Icon name="checkmark-circle-outline" size={54} color={Colors.income || '#22C55E'} />
                <Text style={styles.successTitle}>Check Your Email</Text>
                <Text style={styles.successText}>
                  We have sent password reset instructions to your email address.
                </Text>
                <PrimaryButton
                  title="Back to Sign In"
                  onPress={() => navigation.navigate('Login')}
                  style={styles.backBtn}
                />
              </GlassCard>
            ) : (
              <GlassCard style={styles.formCard}>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <InputField
                      label="Email Address"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      leftIcon="mail-outline"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholder="Enter registered email"
                      error={errors.email?.message}
                    />
                  )}
                />

                <PrimaryButton
                  title="Send Reset Instructions"
                  onPress={handleSubmit(onSubmit)}
                  loading={loading}
                  style={styles.submitBtn}
                />
              </GlassCard>
            )}

            {!success && (
              <TouchableOpacity
                style={styles.footer}
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.7}>
                <Text style={styles.footerText}>Remembered your password? </Text>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.screenPadding || 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl || 24,
    marginTop: Spacing.md || 12,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary || '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary || '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: Spacing.md || 12,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary || '#FFFFFF',
    fontWeight: '800',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary || '#A0A3BD',
    marginTop: Spacing.xs || 4,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  formCard: {
    padding: Spacing.lg || 20,
    gap: Spacing.md || 12,
  },
  successCard: {
    padding: 30,
    alignItems: 'center',
    gap: Spacing.md || 12,
  },
  successTitle: {
    ...Typography.h3,
    color: Colors.textPrimary || '#FFFFFF',
    fontWeight: '700',
  },
  successText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary || '#A0A3BD',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.md || 12,
  },
  backBtn: {
    width: '100%',
  },
  submitBtn: {
    marginTop: Spacing.sm || 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl || 24,
    paddingVertical: Spacing.md || 12,
  },
  footerText: {
    ...Typography.body,
    color: Colors.textSecondary || '#A0A3BD',
  },
  footerLink: {
    ...Typography.body,
    color: Colors.primary || '#2563EB',
    fontWeight: '700',
  },
});

export default ForgotPasswordScreen;
