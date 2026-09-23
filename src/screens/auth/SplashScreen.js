import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Screen from '../../components/templates/Screen';
import AppLogo from '../../components/atoms/AppLogo';
import { colors, spacing, typography, radius } from '../../theme';
import useAppStore from '../../store/useAppStore';

const { width } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
  const initStore = useAppStore((state) => state.initStore);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.7)).current;
  const glowAnim = React.useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Run entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulsing glow behind logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.4,
          duration: 1400,
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Initialize store then finish
    const setupAndFinish = async () => {
      const startTime = Date.now();
      await initStore();
      const elapsedTime = Date.now() - startTime;
      const minDelay = 2000;
      const remainingDelay = Math.max(0, minDelay - elapsedTime);
      setTimeout(() => {
        if (onFinish) onFinish();
      }, remainingDelay);
    };

    setupAndFinish();
  }, [fadeAnim, scaleAnim, glowAnim, initStore, onFinish]);

  return (
    <LinearGradient
      colors={['#090A0F', '#0D0B1A', '#090A0F']}
      style={styles.root}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Screen style={styles.container}>
        <View style={styles.content}>
          {/* Pulsing glow halo behind logo */}
          <Animated.View
            style={[
              styles.logoGlowHalo,
              {
                opacity: glowAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          />

          <Animated.View
            style={{
              marginBottom: spacing.xl,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
              zIndex: 1,
            }}
          >
            <AppLogo size={110} />
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
            <Text style={styles.title}>ExpenseAI</Text>
            <Text style={styles.subtitle}>Smart Financial Intelligence</Text>
          </Animated.View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerBadge}>
            <Text style={styles.footerText}>© ExpenseAI · Powered by AI</Text>
          </View>
        </View>
      </Screen>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logoGlowHalo: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.primaryGlow || 'rgba(138, 63, 252, 0.25)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 0,
  },
  title: {
    fontSize: typography.sizes.display - 4,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -1,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  footer: {
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  footerBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  footerText: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});

export default SplashScreen;
