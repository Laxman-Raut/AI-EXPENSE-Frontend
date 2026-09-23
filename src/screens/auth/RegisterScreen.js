import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../../components/templates/Screen';
import AppLogo from '../../components/atoms/AppLogo';
import Card from '../../components/molecules/Card';
import Input from '../../components/atoms/Input';
import PrimaryButton from '../../components/atoms/PrimaryButton';
import { colors, spacing, typography, radius } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import {
  sendRegistrationOtp,
  resendRegistrationOtp,
  completeRegistration,
} from '../../api/auth';
import { configureGoogleSignIn, signInWithGoogle } from '../../services/googleAuthService';

const OTP_LENGTH = 6;

const RegisterScreen = ({ navigation }) => {
  const auth = useAuth();

  // Wizard Step: 1 = Name+Email, 2 = OTP, 3 = Password
  const [step, setStep] = useState(1);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Field Errors
  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Statuses
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);

  const inputRefs = useRef([]);

  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  useEffect(() => {
    let interval = null;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // ─── STEP 1: SEND OTP ────────────────────────────────────────────────────────
  const handleStep1SendOtp = async () => {
    setFullNameError('');
    setEmailError('');
    setError('');

    let isValid = true;
    if (fullName.trim().length < 3) {
      setFullNameError('Full name must be at least 3 characters');
      isValid = false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setEmailError('This email is invalid. Please enter a correct email address.');
      isValid = false;
    }
    if (!isValid) return;

    setLoading(true);
    try {
      const res = await sendRegistrationOtp(fullName.trim(), email.trim());
      setSuccessMsg(res?.message || 'Verification code sent to your email.');
      setStep(2);
      setTimer(60);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not send verification code.';
      const errorCode = err.response?.data?.errorCode;
      if (errorCode === 'EMAIL_ALREADY_REGISTERED') {
        setEmailError(msg);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── STEP 2: OTP INPUT HANDLERS ──────────────────────────────────────────────
  const handleOtpChange = (text, index) => {
    if (text.length > 1) {
      const pasted = text.trim().slice(0, OTP_LENGTH).split('');
      const newOtp = [...otp];
      pasted.forEach((digit, idx) => {
        newOtp[idx] = digit;
      });
      setOtp(newOtp);
      const nextFocus = Math.min(pasted.length, OTP_LENGTH - 1);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    setError('');

    if (text && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleStep2VerifyOtp = () => {
    const fullOtp = otp.join('');
    if (fullOtp.length < OTP_LENGTH) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }
    setError('');
    setSuccessMsg('OTP verified! Now set a strong password.');
    setStep(3);
  };

  const handleResendOtp = async () => {
    if (timer > 0 || resending) return;
    setError('');
    setSuccessMsg('');
    setResending(true);

    try {
      const res = await resendRegistrationOtp(email.trim());
      setSuccessMsg(res?.message || 'New verification code sent to your email.');
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not resend code.';
      setError(msg);
    } finally {
      setResending(false);
    }
  };

  // ─── STEP 3: COMPLETE REGISTRATION ─────────────────────────────────────────
  const handleStep3CompleteRegistration = async () => {
    setPasswordError('');
    setConfirmPasswordError('');
    setError('');

    let isValid = true;
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      isValid = false;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }
    if (!isValid) return;

    setLoading(true);
    try {
      const fullOtp = otp.join('');
      const res = await completeRegistration(fullName.trim(), email.trim(), fullOtp, password);

      if (res && res.success) {
        try {
          await auth.login(email.trim(), password);
        } catch {
          navigation.replace('Login');
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const googleData = await signInWithGoogle();
      await auth.googleLogin(googleData);
    } catch (err) {
      if (err?.code === 'SIGN_IN_CANCELLED' || err?.message?.includes('cancelled')) {
        return;
      }
      const message = err.response?.data?.message || err.message || 'Google Sign-In failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ─── STEP INDICATOR ──────────────────────────────────────────────────────────
  const StepDot = ({ stepNum }) => {
    const isCompleted = step > stepNum;
    const isActive = step === stepNum;
    return (
      <View style={[
        styles.stepDot,
        isActive && styles.stepDotActive,
        isCompleted && styles.stepDotCompleted,
      ]}>
        {isCompleted
          ? <Icon name="checkmark" size={14} color="#FFFFFF" />
          : <Text style={[styles.stepDotText, isActive && styles.stepDotTextActive]}>{stepNum}</Text>
        }
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* Purple glow strip at top */}
      <LinearGradient
        colors={['rgba(138, 63, 252, 0.09)', 'transparent']}
        style={styles.headerGlow}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />

      <Screen scrollable loading={loading} style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <AppLogo size={72} style={{ marginBottom: spacing.md }} />
          <Text style={styles.appTitle}>Create Account</Text>
          <Text style={styles.subtitle}>
            {step === 1
              ? 'Enter your name & email to start'
              : step === 2
              ? 'Verify the code sent to your email'
              : 'Set a secure password for your account'}
          </Text>
        </View>

        {/* Step Indicator */}
        <View style={styles.stepIndicatorRow}>
          <StepDot stepNum={1} />
          <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
          <StepDot stepNum={2} />
          <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
          <StepDot stepNum={3} />
        </View>

        {/* Form Card */}
        <Card style={styles.formCard}>
          {error ? (
            <View style={styles.errorBanner}>
              <Icon name="alert-circle-outline" size={14} color={colors.danger} style={{ marginRight: 6 }} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}
          {successMsg ? (
            <View style={styles.successBanner}>
              <Icon name="checkmark-circle-outline" size={14} color={colors.success} style={{ marginRight: 6 }} />
              <Text style={styles.successBannerText}>{successMsg}</Text>
            </View>
          ) : null}

          {/* ────────────────── STEP 1: NAME & EMAIL ────────────────── */}
          {step === 1 && (
            <>
              <Input
                value={fullName}
                onChangeText={setFullName}
                placeholder="Full Name"
                autoCapitalize="words"
                icon={<Icon name="person-outline" size={18} color={colors.text.secondary} />}
                error={fullNameError}
              />

              <Input
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError('');
                  if (error) setError('');
                }}
                placeholder="Email Address"
                keyboardType="email-address"
                autoCapitalize="none"
                icon={<Icon name="mail-outline" size={18} color={colors.text.secondary} />}
                error={emailError}
              />

              <PrimaryButton
                title="Send Verification Code"
                onPress={handleStep1SendOtp}
                loading={loading}
                disabled={loading}
                style={styles.actionBtn}
              />
            </>
          )}

          {/* ────────────────── STEP 2: OTP VERIFICATION ────────────────── */}
          {step === 2 && (
            <>
              <View style={styles.emailBadge}>
                <View style={styles.emailBadgeIconWrapper}>
                  <Icon name="mail" size={14} color={colors.primary} />
                </View>
                <Text style={styles.emailBadgeText} numberOfLines={1}>{email}</Text>
                <TouchableOpacity onPress={() => setStep(1)}>
                  <Text style={styles.changeEmailText}>Change</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.otpLabel}>Enter 6-Digit Verification Code</Text>
              <View style={styles.otpRow}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    style={[
                      styles.otpBox,
                      digit ? styles.otpBoxFilled : null,
                      error ? styles.otpBoxError : null,
                    ]}
                    value={digit}
                    onChangeText={(text) => handleOtpChange(text, index)}
                    onKeyPress={(e) => handleOtpKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={OTP_LENGTH}
                    selectTextOnFocus
                    autoFocus={index === 0}
                  />
                ))}
              </View>

              <PrimaryButton
                title="Verify Code"
                onPress={handleStep2VerifyOtp}
                disabled={otp.join('').length < OTP_LENGTH}
                style={styles.actionBtn}
              />

              <View style={styles.resendRow}>
                <Text style={styles.resendLabel}>Didn't receive code? </Text>
                {timer > 0 ? (
                  <Text style={styles.timerText}>Resend in {timer}s</Text>
                ) : (
                  <TouchableOpacity onPress={handleResendOtp} disabled={resending}>
                    {resending ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Text style={styles.resendBtnText}>Resend OTP</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          {/* ────────────────── STEP 3: PASSWORD SETUP ────────────────── */}
          {step === 3 && (
            <>
              <View style={styles.verifiedBadge}>
                <Icon name="checkmark-circle" size={18} color={colors.success} />
                <Text style={styles.verifiedBadgeText}>Email Verified Successfully!</Text>
              </View>

              <Input
                value={password}
                onChangeText={setPassword}
                placeholder="Create Password (min 8 chars)"
                secureTextEntry
                icon={<Icon name="lock-closed-outline" size={18} color={colors.text.secondary} />}
                error={passwordError}
              />

              <Input
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm Password"
                secureTextEntry
                icon={<Icon name="shield-checkmark-outline" size={18} color={colors.text.secondary} />}
                error={confirmPasswordError}
              />

              <PrimaryButton
                title="Complete Registration"
                onPress={handleStep3CompleteRegistration}
                loading={loading}
                disabled={loading}
                style={styles.actionBtn}
              />
            </>
          )}
        </Card>

        {/* Social Logins (Step 1 only) */}
        {step === 1 && (
          <View style={styles.socialSection}>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.googleBtn} activeOpacity={0.8} onPress={handleGoogleSignIn}>
              <View style={styles.googleIconWrapper}>
                <Icon name="logo-google" size={18} color="#EA4335" />
              </View>
              <Text style={styles.googleBtnText}>Sign up with Google</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    zIndex: 0,
  },
  contentContainer: {
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.huge,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  appTitle: {
    fontSize: typography.sizes.xxl + 2,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.lineHeights.base + 2,
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  stepDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  stepDotCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  stepDotText: {
    color: colors.text.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  stepDotTextActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    flex: 1,
    height: 3,
    backgroundColor: colors.border,
    marginHorizontal: 6,
    borderRadius: 2,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  formCard: {
    padding: spacing.xl,
    marginBottom: spacing.md,
    backgroundColor: colors.cardElevated || '#14151E',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(138, 63, 252, 0.18)',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 77, 103, 0.10)',
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    flex: 1,
    color: colors.danger,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    lineHeight: typography.lineHeights.base,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 210, 106, 0.10)',
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  successBannerText: {
    flex: 1,
    color: colors.success,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    lineHeight: typography.lineHeights.base,
  },
  actionBtn: {
    width: '100%',
    marginTop: spacing.sm,
  },
  emailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(138, 63, 252, 0.18)',
    marginBottom: spacing.md,
    gap: 8,
  },
  emailBadgeIconWrapper: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(138, 63, 252, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailBadgeText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
  },
  changeEmailText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  otpLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.md,
    gap: 6,
  },
  otpBox: {
    flex: 1,
    height: 58,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.inputBg || '#0E0F17',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
  },
  otpBoxFilled: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(138, 63, 252, 0.12)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  otpBoxError: {
    borderColor: colors.danger,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  resendLabel: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.muted,
  },
  resendBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 210, 106, 0.10)',
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.md,
    gap: 8,
  },
  verifiedBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.success,
  },
  socialSection: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.divider,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    color: colors.text.muted,
    fontSize: typography.sizes.sm,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 52,
    borderRadius: radius.xl,
    backgroundColor: colors.cardElevated || '#14151E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    gap: 10,
  },
  googleIconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(234, 67, 53, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleBtnText: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  footerText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.base,
  },
  signInText: {
    color: colors.primary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
});

export default RegisterScreen;
