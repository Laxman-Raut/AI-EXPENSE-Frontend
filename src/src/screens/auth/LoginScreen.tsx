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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';

import GradientBackground from '../../components/common/GradientBackground';
import GlassCard from '../../components/common/GlassCard';
import InputField from '../../components/common/InputField';
import PrimaryButton from '../../components/common/PrimaryButton';
import { useAuth } from '../../hooks/useAuth';
import { Colors, Typography, Spacing } from '../../theme';

type Props = NativeStackScreenProps<any, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const auth = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
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
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Icon name="wallet-outline" size={60} color={Colors.primary} />
              <Text style={styles.appTitle}>ExpenseAI</Text>
              <Text style={styles.subtitle}>
                Smart expense tracking powered by AI
              </Text>
            </View>

            {/* Login Form */}
            <GlassCard style={styles.formCard}>
              <InputField
                label="Email"
                value={email}
                onChangeText={setEmail}
                leftIcon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Enter your email"
                error={emailError}
              />

              <InputField
                label="Password"
                value={password}
                onChangeText={setPassword}
                leftIcon="lock-closed-outline"
                isPassword
                placeholder="Enter your password"
                error={passwordError}
              />

              {error ? (
                <View style={styles.errorContainer}>
                  <Icon name="alert-circle-outline" size={18} color={Colors.expense} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <PrimaryButton
                title="Login"
                onPress={handleLogin}
                loading={loading}
                style={styles.loginButton}
              />
            </GlassCard>

            {/* Footer */}
            <TouchableOpacity
              style={styles.footer}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.7}>
              <Text style={styles.footerText}>
                Don't have an account?{' '}
              </Text>
              <Text style={styles.footerLink}>Register</Text>
            </TouchableOpacity>
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
    justifyContent: 'center',
    padding: Spacing.screenPadding,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  appTitle: {
    ...Typography.h1,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  formCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
    borderRadius: 10,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.expense,
    flex: 1,
  },
  loginButton: {
    marginTop: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  footerText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  footerLink: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
});

export default LoginScreen;
