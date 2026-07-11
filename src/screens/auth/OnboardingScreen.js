import React, { useState, useEffect } from 'react';
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
  },
  {
    id: 2,
    title: 'Smart Analytics &\nAI Insights',
    desc: 'Get customized budget analysis\nand detect unusual spending patterns.',
    icon: 'pie-chart-outline',
    gradient: ['#00D26A', '#009e50'],
  },
  {
    id: 3,
    title: 'Cloud Sync &\nSecure Auth',
    desc: 'Access your financial records on\nany device securely with ease.',
    icon: 'shield-checkmark-outline',
    gradient: ['#FF6037', '#e54318'],
  }
];

const OnboardingScreen = ({ navigation }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Check if seen before
    const checkOnboarding = async () => {
      const seen = await AsyncStorage.getItem('onboarding_seen');
      if (seen === 'true') {
        navigation.replace('Login');
      }
    };
    checkOnboarding();
  }, [navigation]);

  const handleNext = async () => {
    if (activeIdx < SLIDES.length - 1) {
      // Animate transition
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -50, duration: 200, useNativeDriver: true })
      ]).start(() => {
        setActiveIdx(activeIdx + 1);
        slideAnim.setValue(50);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true })
        ]).start();
      });
    } else {
      // Mark onboarding seen and navigate to login
      await AsyncStorage.setItem('onboarding_seen', 'true');
      navigation.replace('Login');
    }
  };

  const activeSlide = SLIDES[activeIdx];

  return (
    <View style={styles.root}>
      <Screen style={styles.container}>
        {/* Skip button top-right */}
        <TouchableOpacity 
          style={styles.skipBtn}
          onPress={async () => {
            await AsyncStorage.setItem('onboarding_seen', 'true');
            navigation.replace('Login');
          }}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        {/* Dynamic Slide Illustration */}
        <Animated.View style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}>
          <LinearGradient
            colors={activeSlide.gradient}
            style={styles.illustrationBox}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name={activeSlide.icon} size={72} color="#FFFFFF" />
          </LinearGradient>

          <Text style={styles.title}>{activeSlide.title}</Text>
          <Text style={styles.description}>{activeSlide.desc}</Text>
        </Animated.View>

        {/* Footer Navigation */}
        <View style={styles.footer}>
          {/* Pager Indicator dots */}
          <View style={styles.indicatorContainer}>
            {SLIDES.map((_, idx) => (
              <View 
                key={idx}
                style={[
                  styles.dot, 
                  idx === activeIdx ? styles.activeDot : null
                ]} 
              />
            ))}
          </View>

          {/* Next Action Pill Button */}
          <TouchableOpacity 
            style={styles.nextBtn}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextBtnText}>
              {activeIdx === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <Icon name="arrow-forward-outline" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
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
    padding: spacing.md,
    marginTop: spacing.md,
  },
  skipText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  illustrationBox: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xxl * 1.5,
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  title: {
    fontSize: typography.sizes.xxl + 4,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: typography.lineHeights.xxl + 4,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.lineHeights.md + 2,
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
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.divider,
  },
  activeDot: {
    width: 24,
    backgroundColor: colors.primary,
  },
  nextBtn: {
    height: 52,
    paddingHorizontal: spacing.xl + 4,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
});

export default OnboardingScreen;
