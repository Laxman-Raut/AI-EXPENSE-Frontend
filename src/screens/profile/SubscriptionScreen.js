import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../../components/templates/Screen';
import Card from '../../components/molecules/Card';
import Header from '../../components/molecules/Header';
import PrimaryButton from '../../components/atoms/PrimaryButton';
import { colors, spacing, typography, radius } from '../../theme';
import {
  fetchSubscription,
  upgradeUserSubscription,
  cancelUserSubscription,
  resetUpgradeSuccess,
  clearSubscriptionError,
} from '../../store/subscriptionSlice';
import subscriptionService from '../../services/subscriptionService';

const { width } = Dimensions.get('window');

const SubscriptionScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  
  // Selectors
  const {
    plan,
    status,
    startDate,
    endDate,
    loading,
    error,
    upgradeSuccess,
  } = useSelector((state) => state.subscription);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const proCardScale = useRef(new Animated.Value(1)).current;

  const isPro = subscriptionService.isSubscriptionPro({ plan, status });

  useEffect(() => {
    // Fetch initial subscription data
    dispatch(fetchSubscription());

    // Trigger mount animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      dispatch(resetUpgradeSuccess());
      dispatch(clearSubscriptionError());
    };
  }, [dispatch, fadeAnim, slideAnim]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [
        { text: 'OK', onPress: () => dispatch(clearSubscriptionError()) },
      ]);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (upgradeSuccess) {
      Alert.alert(
        'Subscription Upgraded! 🎉',
        'Welcome to Pro! All features are now unlocked.',
        [
          {
            text: 'Awesome',
            onPress: () => {
              dispatch(resetUpgradeSuccess());
              // Animate pro card on success
              Animated.sequence([
                Animated.timing(proCardScale, {
                  toValue: 1.05,
                  duration: 200,
                  useNativeDriver: true,
                }),
                Animated.timing(proCardScale, {
                  toValue: 1,
                  duration: 200,
                  useNativeDriver: true,
                }),
              ]).start();
            },
          },
        ]
      );
    }
  }, [upgradeSuccess, dispatch, proCardScale]);

  const handleUpgrade = () => {
    dispatch(upgradeUserSubscription());
  };

  const handleManageSubscription = () => {
    Alert.alert(
      'Manage Subscription',
      'You are currently subscribed to the Pro Plan. Do you want to cancel your subscription?',
      [
        { text: 'Keep Pro Plan', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: () => {
            dispatch(cancelUserSubscription());
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <Header
      title="Pro Subscription"
      leftIcon={<Icon name="chevron-back" size={24} color={colors.text.primary} />}
      onLeftPress={() => navigation.goBack()}
    />
  );

  const benefits = [
    { id: '1', title: 'AI Chat Assistant', desc: 'Real-time smart financial analytics and query answering' },
    { id: '2', title: 'AI Receipt Scanner', desc: 'Instantly extract receipt details with high-precision OCR' },
    { id: '3', title: 'Voice Transactions', desc: 'Speak to add income or expense items instantly' },
    { id: '4', title: 'Cloud Backup', desc: 'Secure cloud vault backup for ledger history & logs' },
    { id: '5', title: 'Multi-device Sync', desc: 'Synchronize budgets across multiple devices simultaneously' },
    { id: '6', title: 'Unlimited Documents', desc: 'Upload spreadsheet logs, templates, & CSV receipts' },
    { id: '7', title: 'Priority AI Processing', desc: 'Dedicated queue with sub-second response times' },
  ];

  return (
    <Screen
      scrollable
      header={renderHeader()}
      loading={loading}
      style={styles.screenContent}
    >
      <Animated.View style={[styles.animContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        
        {/* Section 1: Current Plan Card */}
        <Text style={styles.sectionTitle}>Your Status</Text>
        <Card style={[styles.planCard, isPro ? styles.proPlanCard : styles.freePlanCard]}>
          <View style={styles.planHeader}>
            <View style={styles.planBadgeContainer}>
              <Icon
                name={isPro ? 'ribbon' : 'person-circle-outline'}
                size={28}
                color={isPro ? '#FFD700' : colors.text.secondary}
              />
              <Text style={styles.planTitle}>
                {isPro ? 'Pro Subscription' : 'Free Plan'}
              </Text>
            </View>
            <View style={[styles.statusBadge, isPro ? styles.statusBadgePro : styles.statusBadgeFree]}>
              <Text style={styles.statusText}>
                {isPro ? 'Active' : 'Basic'}
              </Text>
            </View>
          </View>

          <Text style={styles.planDescription}>
            {isPro
              ? 'You have complete, unrestricted access to all smart features in the ledger.'
              : 'Unlock advanced features, AI scanning, and unlimited cloud back-up.'}
          </Text>

          {isPro && startDate && (
            <View style={styles.dateContainer}>
              <Icon name="calendar-outline" size={16} color={colors.text.secondary} style={styles.dateIcon} />
              <Text style={styles.dateText}>
                Active since: {subscriptionService.formatRenewalDate(startDate)}
              </Text>
            </View>
          )}
        </Card>

        {/* Section 2: Premium Benefits List */}
        <Text style={styles.sectionTitle}>Premium Access Benefits</Text>
        <Card style={styles.benefitsCard}>
          {benefits.map((benefit, index) => (
            <View key={benefit.id} style={[styles.benefitItem, index === benefits.length - 1 && styles.lastBenefitItem]}>
              <View style={styles.checkContainer}>
                <Icon name="checkmark-circle" size={22} color={colors.primary} />
              </View>
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDesc}>{benefit.desc}</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Section 3: Pricing & Action Button */}
        <Animated.View style={{ transform: [{ scale: proCardScale }] }}>
          <Card style={styles.pricingCard}>
            {isPro ? (
              <View style={styles.proPricingHeader}>
                <Icon name="checkmark-done-circle" size={48} color={colors.success} />
                <Text style={styles.proPricingText}>All Premium Features Active</Text>
                <Text style={styles.proPricingSubtext}>Thank you for supporting AI Expense Tracker!</Text>
                
                <PrimaryButton
                  title="Manage Subscription"
                  type="outline"
                  onPress={handleManageSubscription}
                  style={styles.actionBtn}
                />
              </View>
            ) : (
              <View style={styles.pricingContainer}>
                <View style={styles.pricingHeader}>
                  <Text style={styles.pricingValue}>₹199</Text>
                  <Text style={styles.pricingDuration}>/ month</Text>
                </View>
                <Text style={styles.pricingTerms}>
                  Billed monthly. Cancel anytime with a single tap.
                </Text>

                <PrimaryButton
                  title="Upgrade to Pro"
                  type="primary"
                  icon={<Icon name="flash" size={18} color="#FFFFFF" />}
                  onPress={handleUpgrade}
                  style={styles.actionBtn}
                />
              </View>
            )}
          </Card>
        </Animated.View>

        <View style={styles.footerSpacer} />
      </Animated.View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  animContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  planCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  freePlanCard: {
    borderColor: colors.divider,
    backgroundColor: colors.card,
  },
  proPlanCard: {
    borderColor: colors.primary,
    backgroundColor: '#171328', // Sleek violet-obsidian theme
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  planBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  planTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  statusBadgeFree: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusBadgePro: {
    backgroundColor: 'rgba(0, 210, 106, 0.15)',
  },
  statusText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  planDescription: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: typography.lineHeights.sm + 2,
    marginBottom: spacing.md,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: spacing.md,
  },
  dateIcon: {
    marginRight: spacing.xs,
  },
  dateText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  benefitsCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
  },
  benefitItem: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  lastBenefitItem: {
    borderBottomWidth: 0,
  },
  checkContainer: {
    marginRight: spacing.md,
    justifyContent: 'center',
  },
  benefitTextContainer: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  benefitDesc: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    lineHeight: typography.lineHeights.xs + 2,
  },
  pricingCard: {
    marginTop: spacing.xl,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
  },
  pricingContainer: {
    width: '100%',
    alignItems: 'center',
  },
  pricingHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  pricingValue: {
    fontSize: typography.sizes.xxl + 8,
    fontWeight: typography.weights.black,
    color: colors.text.primary,
  },
  pricingDuration: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
  },
  pricingTerms: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  actionBtn: {
    width: '100%',
  },
  proPricingHeader: {
    alignItems: 'center',
    width: '100%',
    gap: spacing.sm,
  },
  proPricingText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  proPricingSubtext: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  footerSpacer: {
    height: 120,
  },
});

export default SubscriptionScreen;
