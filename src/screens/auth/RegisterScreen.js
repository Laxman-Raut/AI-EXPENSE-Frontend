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

const RegisterScreen = ({ navigation }) => {
  const auth = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let isValid = true;
    setFullNameError('');
    setEmailError('');
    setPasswordError('');

    if (fullName.trim().length < 3) {
      setFullNameError('Name must be at least 3 characters');
      isValid = false;
    }

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

  const handleRegister = async () => {
    if (!validate()) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      await auth.register(fullName.trim(), email.trim(), password);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Registration failed. Please try again.';
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
          <Text style={styles.appTitle}>Create Account</Text>
          <Text style={styles.subtitle}>Start tracking your finances smartly</Text>
        </View>

        {/* Register Form Wrapper */}
        <Card style={styles.formCard}>
          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

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

          <Input
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            icon={<Icon name="lock-closed-outline" size={18} color={colors.text.secondary} />}
            error={passwordError}
          />

          <PrimaryButton
            title="Create Account"
            onPress={handleRegister}
            disabled={loading}
            style={styles.signUpBtn}
          />
        </Card>

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
  signUpBtn: {
    width: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
