import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import Screen from '../../components/templates/Screen';
import Card from '../../components/molecules/Card';
import Input from '../../components/atoms/Input';
import PrimaryButton from '../../components/atoms/PrimaryButton';
import Header from '../../components/molecules/Header';
import { colors, spacing, typography, radius } from '../../theme';

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

  const renderHeader = () => (
    <Header
      title=""
      leftIcon={<Icon name="chevron-back" size={24} color={colors.text.primary} />}
      onLeftPress={() => navigation.goBack()}
    />
  );

  return (
    <View style={styles.root}>
      <Screen 
        scrollable 
        header={renderHeader()}
        style={styles.contentContainer}
      >
        {/* Header Icon & Intro */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Icon name="key-outline" size={32} color={colors.primary} />
          </View>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            No worries! Enter your email and we'll send you recovery instructions.
          </Text>
        </View>

        {success ? (
          <Card style={styles.successCard}>
            <Icon name="checkmark-circle" size={54} color={colors.success} style={styles.successIcon} />
            <Text style={styles.successTitle}>Check Your Email</Text>
            <Text style={styles.successText}>
              We have sent password reset instructions to your email address.
            </Text>
            <PrimaryButton
              title="Back to Sign In"
              onPress={() => navigation.navigate('Login')}
              style={styles.backBtn}
            />
          </Card>
        ) : (
          <Card style={styles.formCard}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email Address"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Enter registered email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  icon={<Icon name="mail-outline" size={18} color={colors.text.secondary} />}
                  error={errors.email?.message}
                />
              )}
            />

            <PrimaryButton
              title="Send Instructions"
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
              style={styles.sendBtn}
            />
          </Card>
        )}
      </Screen>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    marginTop: spacing.lg,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: 'rgba(75, 140, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    lineHeight: typography.lineHeights.base,
  },
  formCard: {
    padding: spacing.xl,
  },
  sendBtn: {
    marginTop: spacing.md,
    width: '100%',
  },
  successCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: spacing.md,
  },
  successTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  successText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.lineHeights.base,
    marginBottom: spacing.xl,
  },
  backBtn: {
    width: '100%',
  },
});

export default ForgotPasswordScreen;
