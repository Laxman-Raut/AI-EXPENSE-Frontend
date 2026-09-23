import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../../components/templates/Screen';
import Card from '../../components/molecules/Card';
import Input from '../../components/atoms/Input';
import PrimaryButton from '../../components/atoms/PrimaryButton';
import AppLogo from '../../components/atoms/AppLogo';
import { colors, spacing, typography, radius } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { useAlert } from '../../context/AlertContext';
import { configureGoogleSignIn, signInWithGoogle } from '../../services/googleAuthService';

const LoginScreen = ({ navigation }) => {
  const auth = useAuth();
  const { showAlert } = useAlert();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  const validate = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');

    if (!email.includes('@')) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validate()) {
      return;
    }

    setError('');
    setEmailError('');
    setPasswordError('');
    setLoading(true);

    try {
      await auth.login(email.trim(), password);
    } catch (err) {
      const requiresVerification =
        err?.requiresVerification ||
        err?.response?.data?.requiresVerification;
      if (requiresVerification) {
        navigation.navigate('OtpVerification', {
          email: err.email || err.response?.data?.email || email.trim(),
        });
        return;
      }

      const message =
        (typeof err === 'string' ? err : null) ||
        err?.message ||
        err?.response?.data?.message ||
        'Login failed. Please try again.';

      setError(message);

      const lower = message.toLowerCase();
      if (
        lower.includes('email') ||
        lower.includes('user not found') ||
        lower.includes('mail') ||
        lower.includes('account') ||
        lower.includes('register')
      ) {
        setEmailError(message);
      } else if (
        lower.includes('password') ||
        lower.includes('incorrect') ||
        lower.includes('credentials')
      ) {
        setPasswordError(message);
      }

      showAlert('Login Failed', message, [{ text: 'OK' }], 'warning');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setEmailError('');
    setPasswordError('');
    setLoading(true);
    try {
      const googleData = await signInWithGoogle();
      await auth.googleLogin(googleData);
    } catch (err) {
      if (err?.code === 'SIGN_IN_CANCELLED' || err?.message?.includes('cancelled')) {
        return;
      }
      const message =
        (typeof err === 'string' ? err : null) ||
        err?.message ||
        err?.response?.data?.message ||
        'Google Sign-In failed. Please try again.';
      setError(message);
      showAlert('Sign-In Failed', message, [{ text: 'OK' }], 'warning');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <Screen
        scrollable
        loading={loading}
        style={styles.contentContainer}
      >
        {/* Purple glow header strip */}
        <LinearGradient
          colors={['rgba(138, 63, 252, 0.10)', 'transparent']}
          style={styles.headerGlow}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          pointerEvents="none"
        />

        {/* Header App Branding */}
        <View style={styles.header}>
          <AppLogo size={76} style={{ marginBottom: spacing.md }} />
          <Text style={styles.appTitle}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Sign in to continue managing your finances</Text>
        </View>

        {/* Login Form Card */}
        <Card style={styles.formCard}>
          {error ? (
            <View style={styles.errorBanner}>
              <Icon name="alert-circle-outline" size={14} color={colors.danger} style={{ marginRight: 6 }} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="Email / Phone"
            keyboardType="email-address"
            autoCapitalize="none"
            icon={<Icon name="mail-outline" size={18} color={colors.text.secondary} />}
            error={emailError}
          />

          <Input
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            icon={<Icon name="lock-closed-outline" size={18} color={colors.text.secondary} />}
            error={passwordError}
          />

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => navigation.navigate('ForgotPassword')}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <PrimaryButton
            title="Sign In"
            onPress={handleLogin}
            disabled={loading}
            style={styles.signInBtn}
          />
        </Card>

        {/* Social Logins */}
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
            <Text style={styles.googleBtnText}>Sign in with Google</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.7}>
            <Text style={styles.signUpText}>Sign Up</Text>
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
    paddingTop: spacing.huge,
    paddingBottom: spacing.huge,
  },
  headerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 240,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl * 1.5,
  },
  appTitle: {
    fontSize: typography.sizes.xxl + 4,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.lineHeights.base + 2,
  },
  formCard: {
    padding: spacing.xl,
    marginBottom: spacing.lg,
    backgroundColor: colors.cardElevated || '#14151E',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(138, 63, 252, 0.20)',
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xl,
    marginTop: -spacing.sm,
  },
  forgotText: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  signInBtn: {
    width: '100%',
  },
  socialSection: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.lg,
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
    fontSize: typography.sizes.md,
  },
  signUpText: {
    color: colors.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
});

export default LoginScreen;
