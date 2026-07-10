import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import GradientBackground from '../../components/common/GradientBackground';
import { Colors, Typography, Spacing } from '../../theme';
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
  }, []);

  return (
    <GradientBackground style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}>
          <Icon name="wallet-outline" size={80} color="#FFFFFF" />
        </Animated.View>
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.title}>ExpenseAI</Text>
          <Text style={styles.subtitle}>Smart Financial Intelligence</Text>
        </Animated.View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Secure Wallet Intelligence</Text>
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logoContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: Colors.primary || '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl || 24,
    shadowColor: Colors.primary || '#2563EB',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    ...Typography.h1,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 36,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary || '#A0A3BD',
    marginTop: Spacing.xs || 4,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 1.5,
  },
  footer: {
    paddingBottom: 40,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textMuted || '#6B6E8A',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});

export default SplashScreen;
