import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../../components/templates/Screen';
import Card from '../../components/molecules/Card';
import PrimaryButton from '../../components/atoms/PrimaryButton';
import { colors, spacing, typography, radius } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { resendRegistrationOtp } from '../../api/auth';

const OTP_LENGTH = 6;

const OtpVerificationScreen = ({ route, navigation }) => {
  const { email = '', fullName = '' } = route.params || {};
  const auth = useAuth();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [timer, setTimer] = useState(60);

  const inputRefs = useRef([]);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (text, index) => {
    // Handle pasting 6 digits
    if (text.length > 1) {
      const pastedDigits = text.trim().slice(0, OTP_LENGTH).split('');
      const newOtp = [...otp];
      pastedDigits.forEach((digit, idx) => {
        newOtp[idx] = digit;
      });
      setOtp(newOtp);
      const nextFocus = Math.min(pastedDigits.length, OTP_LENGTH - 1);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    setError('');

    // Auto-focus next box
    if (text && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length < OTP_LENGTH) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await auth.verifyOtp(email, fullOtp);
      setSuccessMsg('Account verified successfully!');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Verification failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resending) return;

    setError('');
    setSuccessMsg('');
    setResending(true);

    try {
      const res = await resendRegistrationOtp(email);
      setSuccessMsg(res?.message || 'A new verification code has been sent to your email.');
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not resend verification code.';
      setError(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <Screen style={styles.screenContainer}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={22} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.topSection}>
          <LinearGradient
            colors={[colors.primary, '#5E1BDB']}
            style={styles.iconGradient}
          >
            <Icon name="mail-unread-outline" size={32} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.subtitle}>
            We have sent a 6-digit verification code to
          </Text>
          <Text style={styles.emailHighlight}>{email}</Text>
        </View>

        <Card style={styles.card}>
          {error ? (
            <View style={styles.errorBanner}>
              <Icon name="alert-circle-outline" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {successMsg ? (
            <View style={styles.successBanner}>
              <Icon name="checkmark-circle-outline" size={18} color={colors.success} />
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          ) : null}

          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.otpInput,
                  digit ? styles.otpInputFilled : null,
                  error ? styles.otpInputError : null,
                ]}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={OTP_LENGTH}
                selectTextOnFocus
                autoFocus={index === 0}
              />
            ))}
          </View>

          <PrimaryButton
            title={loading ? 'Verifying...' : 'Verify Email'}
            onPress={handleVerify}
            loading={loading}
            disabled={loading || otp.join('').length < OTP_LENGTH}
            style={styles.verifyBtn}
          />

          <View style={styles.resendContainer}>
            <Text style={styles.resendLabel}>Didn't receive the code? </Text>
            {timer > 0 ? (
              <Text style={styles.timerText}>Resend in {timer}s</Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={resending}>
                {resending ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.resendAction}>Resend Code</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </Card>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    backgroundColor: colors.background,
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  headerRow: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.xl,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.heading,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  emailHighlight: {
    fontSize: typography.sizes.body,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  card: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger + '15',
    borderWidth: 1,
    borderColor: colors.danger + '40',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '15',
    borderWidth: 1,
    borderColor: colors.success + '40',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  successText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.md,
  },
  otpInput: {
    width: 44,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
  },
  otpInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  otpInputError: {
    borderColor: colors.danger,
  },
  verifyBtn: {
    marginTop: spacing.md,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  resendLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.muted,
  },
  resendAction: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default OtpVerificationScreen;
