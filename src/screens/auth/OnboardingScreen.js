import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Screen from '../../components/templates/Screen';
import { colors, spacing, typography, radius } from '../../theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: 1,
    title: 'Track Your Expenses\nIn Seconds',
    desc: 'All your expenses in one place.\nSimple, fast and secure.',
    icon: 'wallet-outline',
    gradient: ['#8A3FFC', '#5E1BDB'],
    glowColor: 'rgba(138, 63, 252, 0.35)',
  },
  {
    id: 2,
    title: 'Smart Analytics &\nAI Insights',
    desc: 'Get customized budget analysis\nand detect unusual spending patterns.',
    icon: 'pie-chart-outline',
    gradient: ['#00D26A', '#009e50'],
    glowColor: 'rgba(0, 210, 106, 0.35)',
  },
  {
    id: 3,
    title: 'Cloud Sync &\nSecure Auth',
    desc: 'Access your financial records on\nany device securely with ease.',
    icon: 'shield-checkmark-outline',
    gradient: ['#FF6037', '#e54318'],
    glowColor: 'rgba(255, 96, 55, 0.35)',
  },
];

const OnboardingScreen = ({ navigation }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Animated dot widths
  const dotWidths = useRef(SLIDES.map((_, i) => new Animated.Value(i === 0 ? 28 : 8))).current;

  useEffect(() => {
    const checkOnboarding = async () => {
      const seen = await AsyncStorage.getItem('onboarding_seen');
      if (seen === 'true') {
        navigation.replace('Login');
      }
    };
    checkOnboarding();
  }, [navigation]);

  const animateToSlide = (nextIdx) => {
    // Animate dots
    SLIDES.forEach((_, i) => {
      Animated.spring(dotWidths[i], {
        toValue: i === nextIdx ? 28 : 8,
        useNativeDriver: false,
        friction: 6,
        tension: 80,
      }).start();
    });
  };

  const handleNext = async () => {
    if (activeIdx < SLIDES.length - 1) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -50, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        const next = activeIdx + 1;
        setActiveIdx(next);
        animateToSlide(next);
        slideAnim.setValue(50);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
      });
    } else {
      await AsyncStorage.setItem('onboarding_seen', 'true');
      navigation.replace('Login');
    }
  };

  const activeSlide = SLIDES[activeIdx];

  return (
    <View style={styles.root}>
      <Screen style={styles.container}>
        {/* Skip button */}
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={async () => {
            await AsyncStorage.setItem('onboarding_seen', 'true');
            navigation.replace('Login');
          }}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        {/* Slide Content */}
        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Glow halo behind illustration */}
          <View style={[styles.illustrationGlow, { shadowColor: activeSlide.glowColor }]} />

          <LinearGradient
            colors={activeSlide.gradient}
            style={styles.illustrationBox}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name={activeSlide.icon} size={80} color="#FFFFFF" />
          </LinearGradient>

          <Text style={styles.title}>{activeSlide.title}</Text>
          <Text style={styles.description}>{activeSlide.desc}</Text>
        </Animated.View>

        {/* Footer Navigation */}
        <View style={styles.footer}>
          {/* Animated dot indicators */}
          <View style={styles.indicatorContainer}>
            {SLIDES.map((_, idx) => (
              <Animated.View
                key={idx}
                style={[
                  styles.dot,
                  idx === activeIdx ? styles.activeDot : null,
                  { width: dotWidths[idx] },
                ]}
              />
            ))}
          </View>

          {/* Gradient CTA button */}
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.82}
            style={styles.nextBtnShadow}
          >
            <LinearGradient
              colors={[colors.primaryLight, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.nextBtn}
            >
              <Text style={styles.nextBtnText}>
                {activeIdx === SLIDES.length - 1 ? 'Get Started' : 'Next'}
              </Text>
              <Icon name="arrow-forward-outline" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </LinearGradient>
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
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
    paddingBottom: spacing.xxl,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  skipText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  illustrationGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: '10%',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 50,
    elevation: 0,
  },
  illustrationBox: {
    width: 190,
    height: 190,
    borderRadius: 95,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xxl * 1.5,
    elevation: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  title: {
    fontSize: typography.sizes.xxl + 4,
    fontWeight: '900',
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: typography.lineHeights.xxl + 4,
    marginBottom: spacing.md,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.lineHeights.md + 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    marginTop: spacing.lg,
  },
  indicatorContainer: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.divider,
  },
  activeDot: {
    backgroundColor: colors.primary,
  },
  nextBtnShadow: {
    borderRadius: radius.full,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  nextBtn: {
    height: 52,
    paddingHorizontal: spacing.xl + 4,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
});

export default OnboardingScreen;
