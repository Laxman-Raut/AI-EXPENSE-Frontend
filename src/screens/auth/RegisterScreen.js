import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../../components/templates/Screen';
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
    if (!email.includes('@')) {
      setEmailError('Please enter a valid email address');
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
      setError(msg);
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
      
      if (res && res.success && res.data) {
        // Automatically log in the user via Redux / AuthContext
        await auth.login(email.trim(), password);
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

  return (
    <View style={styles.root}>
      <Screen scrollable loading={loading} style={styles.contentContainer}>
        {/* Header App Branding */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#FF6037', '#8A3FFC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Icon name="wallet" size={28} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <Text style={styles.appTitle}>Create Account</Text>
          <Text style={styles.subtitle}>
            {step === 1
              ? 'Enter your name & email to start'
              : step === 2
              ? 'Verify the code sent to your email'
              : 'Set a secure password for your account'}
          </Text>
        </View>

        {/* Step Indicator Bar */}
        <View style={styles.stepIndicatorRow}>
          <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
            <Text style={styles.stepDotText}>1</Text>
          </View>
          <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
          <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]}>
            <Text style={styles.stepDotText}>2</Text>
          </View>
          <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
          <View style={[styles.stepDot, step >= 3 && styles.stepDotActive]}>
            <Text style={styles.stepDotText}>3</Text>
          </View>
        </View>

        {/* Form Card */}
        <Card style={styles.formCard}>
          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
          {successMsg ? <Text style={styles.successBanner}>{successMsg}</Text> : null}

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
                onChangeText={setEmail}
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
                <Icon name="mail" size={16} color={colors.primary} />
                <Text style={styles.emailBadgeText}>{email}</Text>
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
                <Text style={styles.verifiedBadgeText}>Email Code Verified!</Text>
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

        {/* Social Logins (Only on Step 1) */}
        {step === 1 && (
          <View style={styles.socialSection}>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8} onPress={handleGoogleSignIn}>
                <Icon name="logo-google" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
                <Icon name="logo-apple" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Footer Actions */}
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
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  logoGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepDotText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 6,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  formCard: {
    padding: spacing.xl,
    marginBottom: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorBanner: {
    backgroundColor: 'rgba(255, 77, 103, 0.1)',
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  successBanner: {
    backgroundColor: 'rgba(0, 210, 106, 0.1)',
    borderColor: colors.success,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    color: colors.success,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  actionBtn: {
    width: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    marginTop: spacing.sm,
  },
  emailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    gap: 8,
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
  },
  otpBox: {
    width: 40,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  otpBoxFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
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
    backgroundColor: colors.success + '15',
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.success + '40',
    marginBottom: spacing.md,
    gap: 8,
    justifyContent: 'center',
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
  socialButtonsContainer: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  socialBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
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
