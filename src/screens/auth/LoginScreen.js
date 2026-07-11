import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../../components/templates/Screen';
import Card from '../../components/molecules/Card';
import Input from '../../components/atoms/Input';
import PrimaryButton from '../../components/atoms/PrimaryButton';
import { colors, spacing, typography, radius } from '../../theme';
import { useAuth } from '../../hooks/useAuth';

const LoginScreen = ({ navigation }) => {
  const auth = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    setLoading(true);

    try {
      await auth.login(email.trim(), password);
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Login failed. Please try again.';
      setError(message);
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
          <Text style={styles.appTitle}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Login to continue</Text>
        </View>

        {/* Login Form Wrapper */}
        <Card style={styles.formCard}>
          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

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
            title="Login"
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

          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
              <Icon name="logo-google" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
              <Icon name="logo-apple" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Actions */}
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
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl * 1.5,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.md,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: typography.sizes.xxl + 2,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  formCard: {
    padding: spacing.xl,
    marginBottom: spacing.lg,
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
    padding: spacing.md,
    color: colors.danger,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.md,
    lineHeight: typography.lineHeights.base,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xl,
  },
  forgotText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  signInBtn: {
    width: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  socialSection: {
    alignItems: 'center',
    marginVertical: spacing.xl,
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
  socialButtonsContainer: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  socialBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
  signUpText: {
    color: colors.primary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
});

export default LoginScreen;
