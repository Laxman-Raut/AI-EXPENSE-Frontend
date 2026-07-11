import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../../components/templates/Screen';
import { colors, spacing, typography, radius, shadow } from '../../theme';
import useAppStore from '../../store/useAppStore';

const { width } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
  const initStore = useAppStore((state) => state.initStore);
  
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    // Run animations
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

    // Initialize Zustand store and delay slightly for aesthetics
    const setupAndFinish = async () => {
      const startTime = Date.now();
      await initStore();
      const elapsedTime = Date.now() - startTime;
      const minDelay = 2000; // Show splash for at least 2 seconds
      
      const remainingDelay = Math.max(0, minDelay - elapsedTime);
      setTimeout(() => {
        if (onFinish) onFinish();
      }, remainingDelay);
    };

    setupAndFinish();
  }, [fadeAnim, scaleAnim, initStore, onFinish]);

  return (
    <View style={styles.root}>
      <Screen style={styles.container}>
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.logoContainer,
              shadow.lg,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}>
            <Icon name="sparkles" size={54} color="#FFFFFF" />
          </Animated.View>
          <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
            <Text style={styles.title}>ExpenseAI</Text>
            <Text style={styles.subtitle}>Smart Financial Intelligence</Text>
          </Animated.View>
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>Secure Wallet Intelligence</Text>
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
  logoContainer: {
    width: 110,
    height: 110,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  title: {
    fontSize: typography.sizes.display - 4,
    fontWeight: typography.weights.bold,
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
  },
  footerText: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});

export default SplashScreen;
