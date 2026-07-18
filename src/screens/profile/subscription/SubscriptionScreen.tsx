import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenImport from '../../../components/templates/Screen';
import HeaderImport from '../../../components/molecules/Header';
import CardImport from '../../../components/molecules/Card';
import PrimaryButtonImport from '../../../components/atoms/PrimaryButton';
import { colors, spacing, typography as themeTypography, radius } from '../../../theme';
import { usePayment } from '../../../hooks/usePayment';
import { fetchSubscription } from '../../../store/subscriptionSlice';
import subscriptionService from '../../../services/subscriptionService';

// Cast JS components as any to avoid fontWeight / prop type conflicts
const Screen = ScreenImport as any;
const Header = HeaderImport as any;
const Card = CardImport as any;
const PrimaryButton = PrimaryButtonImport as any;
const typography = themeTypography as any;

const SubscriptionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useDispatch<any>();
  const subscription = useSelector((state: any) => state.subscription);
  const { startSubscriptionPayment, isLoading } = usePayment();

  const [selectedPlan, setSelectedPlan] = useState<'pro_monthly' | 'pro_yearly'>('pro_yearly');
  const fadeAnim = useState(new Animated.Value(0))[0];

  const isPro = subscriptionService.isSubscriptionPro(subscription);

  useEffect(() => {
    // Fetch latest subscription status on mount
    dispatch(fetchSubscription());

    // Fade-in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [dispatch, fadeAnim]);

  const handleSubscribe = () => {
    startSubscriptionPayment(selectedPlan);
  };

  const handleRestorePurchase = () => {
    Alert.alert(
      'Restore Purchase',
      'Checking App Store / Play Store for previous purchases... your subscription details will be refreshed.',
      [
        {
          text: 'OK',
          onPress: () => {
            dispatch(fetchSubscription());
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <Header
      title="Upgrade Premium"
      leftIcon={<Icon name="chevron-back" size={24} color={colors.text.primary} />}
      onLeftPress={() => navigation.goBack()}
    />
  );

  const benefits = [
    { name: 'AI Chat Assistant', free: '3 queries / day', pro: 'Unlimited & Priority' },
    { name: 'AI Receipt Scanner', free: '1 scan / day', pro: 'Unlimited scans' },
    { name: 'Voice Transactions', free: '❌', pro: 'Unlimited' },
    { name: 'Cloud Sync & Backup', free: 'Local Only', pro: 'Secure Cloud Vault' },
    { name: 'Statement Exports', free: 'PDF Only', pro: 'PDF + Excel + Custom' },
  ];

  return (
    <Screen header={renderHeader()} scrollable={true} loading={isLoading}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        
        {/* Current Subscription Status */}
        <Card style={[styles.statusCard, isPro ? styles.proStatus : styles.freeStatus]} variant="solid">
          <View style={styles.statusHeader}>
            <View style={styles.statusTitleRow}>
              <Icon
                name={isPro ? 'ribbon' : 'person-circle-outline'}
                size={28}
                color={isPro ? '#FFD700' : colors.text.secondary}
              />
              <Text style={styles.statusTitle}>
                {isPro ? 'Premium Pro' : 'Free Basic Plan'}
              </Text>
            </View>
            <View style={[styles.badge, isPro ? styles.badgePro : styles.badgeFree]}>
              <Text style={styles.badgeText}>{isPro ? 'ACTIVE' : 'BASIC'}</Text>
            </View>
          </View>

          <Text style={styles.statusDesc}>
            {isPro
              ? 'Thank you for supporting us! You have complete, unrestricted access to all smart features in the ledger.'
              : 'Unlock advanced AI scanning, unlimited voice commands, and automatic cross-device cloud backups.'}
          </Text>

          {isPro && subscription.endDate && (
            <View style={styles.expiryRow}>
              <Icon name="time-outline" size={16} color={colors.text.secondary} />
              <Text style={styles.expiryText}>
                Renews/Expires on: {subscriptionService.formatRenewalDate(subscription.endDate)}
              </Text>
            </View>
          )}
        </Card>

        {/* Pricing Toggles */}
        {!isPro && (
          <View style={styles.pricingSection}>
            <Text style={styles.sectionTitle}>Choose a subscription plan</Text>
            
            <View style={styles.plansContainer}>
              {/* Yearly Card */}
              <TouchableOpacity
                activeOpacity={0.9}
                style={[
                  styles.planCard,
                  selectedPlan === 'pro_yearly' ? styles.selectedPlanCard : null,
                ]}
                onPress={() => setSelectedPlan('pro_yearly')}
              >
                {selectedPlan === 'pro_yearly' && (
                  <View style={styles.selectedTick}>
                    <Icon name="checkmark-circle" size={20} color={colors.primary} />
                  </View>
                )}
                <View style={styles.planDiscountBadge}>
                  <Text style={styles.discountText}>Save 16%</Text>
                </View>
                <Text style={styles.planPeriod}>Yearly Access</Text>
                <Text style={styles.planPrice}>₹1,999</Text>
                <Text style={styles.planSubprice}>Equivalent to ₹166/month</Text>
              </TouchableOpacity>

              {/* Monthly Card */}
              <TouchableOpacity
                activeOpacity={0.9}
                style={[
                  styles.planCard,
                  selectedPlan === 'pro_monthly' ? styles.selectedPlanCard : null,
                ]}
                onPress={() => setSelectedPlan('pro_monthly')}
              >
                {selectedPlan === 'pro_monthly' && (
                  <View style={styles.selectedTick}>
                    <Icon name="checkmark-circle" size={20} color={colors.primary} />
                  </View>
                )}
                <Text style={styles.planPeriod}>Monthly Access</Text>
                <Text style={styles.planPrice}>₹199</Text>
                <Text style={styles.planSubprice}>Billed monthly, cancel anytime</Text>
              </TouchableOpacity>
            </View>

            {/* Subscribe Actions */}
            <PrimaryButton
              title={`Subscribe Now - ${selectedPlan === 'pro_yearly' ? '₹1,999/yr' : '₹199/mo'}`}
              type="primary"
              onPress={handleSubscribe}
              style={styles.subscribeBtn}
              icon={<Icon name="flash" size={18} color="#FFFFFF" />}
            />

            <TouchableOpacity onPress={handleRestorePurchase} style={styles.restoreBtn}>
              <Text style={styles.restoreBtnText}>Restore Previous Purchase</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Feature Comparison List */}
        <Text style={styles.sectionTitle}>Feature Comparison</Text>
        <Card style={styles.comparisonCard} variant="solid">
          <View style={[styles.comparisonRow, styles.comparisonHeaderRow]}>
            <Text style={[styles.comparisonCol, styles.comparisonHeaderCol, styles.colFeature]}>Feature</Text>
            <Text style={[styles.comparisonCol, styles.comparisonHeaderCol, styles.colFree]}>Free</Text>
            <Text style={[styles.comparisonCol, styles.comparisonHeaderCol, styles.colPro]}>Pro</Text>
          </View>

          {benefits.map((item, index) => (
            <View
              key={index}
              style={[
                styles.comparisonRow,
                index === benefits.length - 1 ? styles.lastComparisonRow : null,
              ]}
            >
              <Text style={[styles.comparisonCol, styles.colFeature, styles.featureName]}>{item.name}</Text>
              <Text style={[styles.comparisonCol, styles.colFree, styles.colText]}>{item.free}</Text>
              <Text style={[styles.comparisonCol, styles.colPro, styles.colTextHighlight]}>{item.pro}</Text>
            </View>
          ))}
        </Card>

        {/* Legal Links Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => Alert.alert('Terms of Service', 'Standard Terms & Conditions apply for using AI Expense Tracker subscriptions.')}>
            <Text style={styles.footerLink}>Terms of Service</Text>
          </TouchableOpacity>
          <Text style={styles.footerDivider}>|</Text>
          <TouchableOpacity onPress={() => Alert.alert('Privacy Policy', 'We value your privacy. We never sell your transaction history or user data.')}>
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
      </Animated.View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  statusCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  freeStatus: {
    backgroundColor: colors.card,
    borderColor: colors.divider,
  },
  proStatus: {
    backgroundColor: 'rgba(138, 63, 252, 0.1)',
    borderColor: colors.primary,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  badgeFree: {
    backgroundColor: colors.divider,
  },
  badgePro: {
    backgroundColor: 'rgba(0, 210, 106, 0.2)',
  },
  badgeText: {
    fontSize: typography.sizes.xs - 2,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  statusDesc: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: typography.lineHeights.sm + 2,
    marginBottom: spacing.md,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
  },
  expiryText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  pricingSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  plansContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  planCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.divider,
    padding: spacing.md,
    position: 'relative',
    minHeight: 140,
    justifyContent: 'center',
  },
  selectedPlanCard: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(138, 63, 252, 0.05)',
  },
  selectedTick: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  planDiscountBadge: {
    position: 'absolute',
    top: -10,
    left: spacing.sm,
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  discountText: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    color: colors.background,
    textTransform: 'uppercase',
  },
  planPeriod: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
    marginBottom: 4,
  },
  planPrice: {
    fontSize: typography.sizes.lg + 4,
    fontWeight: typography.weights.heavy,
    color: colors.text.primary,
    marginBottom: 2,
  },
  planSubprice: {
    fontSize: 9,
    color: colors.text.secondary,
  },
  subscribeBtn: {
    width: '100%',
    marginBottom: spacing.md,
  },
  restoreBtn: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
  },
  restoreBtnText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textDecorationLine: 'underline',
  },
  comparisonCard: {
    padding: spacing.md,
    backgroundColor: colors.card,
    borderColor: colors.divider,
    borderWidth: 1,
    borderRadius: radius.lg,
    marginBottom: spacing.xl,
  },
  comparisonRow: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    alignItems: 'center',
  },
  lastComparisonRow: {
    borderBottomWidth: 0,
  },
  comparisonHeaderRow: {
    borderBottomWidth: 1.5,
    borderBottomColor: colors.divider,
    paddingBottom: spacing.sm,
  },
  comparisonCol: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  comparisonHeaderCol: {
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  colFeature: {
    flex: 1.8,
  },
  colFree: {
    flex: 1.2,
    textAlign: 'center',
  },
  colPro: {
    flex: 1.5,
    textAlign: 'center',
  },
  featureName: {
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  colText: {
    color: colors.text.secondary,
  },
  colTextHighlight: {
    color: colors.primaryLight,
    fontWeight: typography.weights.bold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  footerLink: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textDecorationLine: 'underline',
  },
  footerDivider: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
  },
  spacer: {
    height: 120,
  },
});

export default SubscriptionScreen;
