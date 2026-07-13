import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import Screen from '../../components/templates/Screen';
import Card from '../../components/molecules/Card';
import Input from '../../components/atoms/Input';
import PrimaryButton from '../../components/atoms/PrimaryButton';
import Header from '../../components/molecules/Header';
import { colors, spacing, typography, radius } from '../../theme';
import { forgotPassword, verifyOtp, resetPassword } from '../../api/auth';

const ForgotPasswordScreen = ({ navigation }) => {
  const [step, setStep] = useState('EMAIL'); // 'EMAIL' | 'OTP' | 'PASSWORD' | 'SUCCESS'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Loading states
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Error states
  const [emailError, setEmailError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validateEmail = (val) => {
    if (!val) {
      setEmailError('Email is required');
      return false;
    }
    const reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!reg.test(val)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleRequestOtp = async () => {
    if (!validateEmail(email)) return;
    setLoading(true);
    setGeneralError('');
    try {
      const res = await forgotPassword(email.trim().toLowerCase());
      if (res.success) {
        setStep('OTP');
      } else {
        setGeneralError(res.message || 'Failed to send OTP. Please check email.');
      }
    } catch (err) {
      setGeneralError(err.response?.data?.message || err.message || 'Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP');
      return;
    }
    setOtpError('');
    setLoading(true);
    setGeneralError('');
    try {
      const res = await verifyOtp(email.trim().toLowerCase(), otp.trim());
      if (res.success) {
        setStep('PASSWORD');
      } else {
        setGeneralError(res.message || 'Verification failed. Invalid OTP.');
      }
    } catch (err) {
      setGeneralError(err.response?.data?.message || err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    let isValid = true;
    if (!password || password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    } else {
      setConfirmPasswordError('');
    }

    if (!isValid) return;

    setLoading(true);
    setGeneralError('');
    try {
      const res = await resetPassword(
        email.trim().toLowerCase(),
        otp.trim(),
        password
      );
      if (res.success) {
        setStep('SUCCESS');
      } else {
        setGeneralError(res.message || 'Reset password failed. OTP may have expired.');
      }
    } catch (err) {
      setGeneralError(err.response?.data?.message || err.message || 'Reset password failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    setGeneralError('');
    setSuccessMessage('');
    try {
      const res = await forgotPassword(email.trim().toLowerCase());
      if (res.success) {
        setSuccessMessage('OTP resent successfully!');
      } else {
        setGeneralError(res.message || 'Failed to resend OTP.');
      }
    } catch (err) {
      setGeneralError(err.response?.data?.message || err.message || 'Server error. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleBack = () => {
    if (step === 'OTP') {
      setStep('EMAIL');
      setOtp('');
      setOtpError('');
      setGeneralError('');
      setSuccessMessage('');
    } else if (step === 'PASSWORD') {
      setStep('OTP');
      setPassword('');
      setConfirmPassword('');
      setPasswordError('');
      setConfirmPasswordError('');
      setGeneralError('');
      setSuccessMessage('');
    } else {
      navigation.goBack();
    }
  };

  const renderHeader = () => {
    if (step === 'SUCCESS') return null;
    return (
      <Header
        title=""
        leftIcon={<Icon name="chevron-back" size={24} color={colors.text.primary} />}
        onLeftPress={handleBack}
      />
    );
  };

  return (
    <View style={styles.root}>
      <Screen 
        scrollable 
        header={renderHeader()}
        style={styles.contentContainer}
        loading={loading}
      >
        {/* Step 1: EMAIL */}
        {step === 'EMAIL' && (
          <View>
            <View style={styles.header}>
              <View style={styles.logoBox}>
                <Icon name="key-outline" size={32} color={colors.primary} />
              </View>
              <Text style={styles.title}>Forgot Password?</Text>
              <Text style={styles.subtitle}>
                No worries! Enter your email and we'll send you an OTP to verify and reset your password.
              </Text>
            </View>

            <Card style={styles.formCard}>
              {generalError ? (
                <Text style={styles.errorBanner}>{generalError}</Text>
              ) : null}

              <Input
                label="Email Address"
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  if (emailError) validateEmail(val);
                }}
                placeholder="Enter registered email"
                keyboardType="email-address"
                autoCapitalize="none"
                icon={<Icon name="mail-outline" size={18} color={colors.text.secondary} />}
                error={emailError}
              />

              <PrimaryButton
                title="Send OTP"
                onPress={handleRequestOtp}
                disabled={loading}
                style={styles.sendBtn}
              />
            </Card>
          </View>
        )}

        {/* Step 2: OTP */}
        {step === 'OTP' && (
          <View>
            <View style={styles.header}>
              <View style={styles.logoBox}>
                <Icon name="shield-checkmark-outline" size={32} color={colors.primary} />
              </View>
              <Text style={styles.title}>Enter OTP</Text>
              <Text style={styles.subtitle}>
                Please enter the 6-digit OTP code sent to {email}
              </Text>
            </View>

            <Card style={styles.formCard}>
              {generalError ? (
                <Text style={styles.errorBanner}>{generalError}</Text>
              ) : null}
              {successMessage ? (
                <Text style={styles.successBanner}>{successMessage}</Text>
              ) : null}

              <Input
                label="Verification Code"
                value={otp}
                onChangeText={(val) => {
                  setOtp(val);
                  if (val.length === 6) setOtpError('');
                }}
                placeholder="Enter 6-digit OTP"
                keyboardType="number-pad"
                maxLength={6}
                icon={<Icon name="lock-closed-outline" size={18} color={colors.text.secondary} />}
                error={otpError}
              />

              <PrimaryButton
                title="Verify OTP"
                onPress={handleVerifyOtp}
                disabled={loading}
                style={styles.sendBtn}
              />

              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>Didn't receive the OTP? </Text>
                <TouchableOpacity onPress={handleResendOtp} disabled={resending}>
                  <Text style={styles.resendLink}>{resending ? 'Resending...' : 'Resend'}</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </View>
        )}

        {/* Step 3: PASSWORD */}
        {step === 'PASSWORD' && (
          <View>
            <View style={styles.header}>
              <View style={styles.logoBox}>
                <Icon name="lock-open-outline" size={32} color={colors.primary} />
              </View>
              <Text style={styles.title}>New Password</Text>
              <Text style={styles.subtitle}>
                Create a new secure password for your account.
              </Text>
            </View>

            <Card style={styles.formCard}>
              {generalError ? (
                <Text style={styles.errorBanner}>{generalError}</Text>
              ) : null}

              <Input
                label="New Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Minimum 8 characters"
                icon={<Icon name="lock-closed-outline" size={18} color={colors.text.secondary} />}
                error={passwordError}
              />

              <Input
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Confirm your password"
                icon={<Icon name="lock-closed-outline" size={18} color={colors.text.secondary} />}
                error={confirmPasswordError}
              />

              <PrimaryButton
                title="Reset Password"
                onPress={handleResetPassword}
                disabled={loading}
                style={styles.sendBtn}
              />
            </Card>
          </View>
        )}

        {/* Step 4: SUCCESS */}
        {step === 'SUCCESS' && (
          <Card style={styles.successCard}>
            <Icon name="checkmark-circle" size={54} color={colors.success} style={styles.successIcon} />
            <Text style={styles.successTitle}>Password Reset Success</Text>
            <Text style={styles.successText}>
              Your password has been successfully updated. You can now sign in using your new password.
            </Text>
            <PrimaryButton
              title="Back to Sign In"
              onPress={() => navigation.navigate('Login')}
              style={styles.backBtn}
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
  errorBanner: {
    backgroundColor: 'rgba(255, 77, 103, 0.1)',
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.md,
    color: colors.danger,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.md,
    lineHeight: typography.lineHeights.base,
  },
  successBanner: {
    backgroundColor: 'rgba(0, 210, 106, 0.1)',
    borderColor: colors.success,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.md,
    color: colors.success,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.md,
    lineHeight: typography.lineHeights.base,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  resendText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  resendLink: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
  },
  successCard: {
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.huge,
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
