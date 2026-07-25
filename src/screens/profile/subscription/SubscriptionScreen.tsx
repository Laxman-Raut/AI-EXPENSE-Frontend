import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert, ActivityIndicator, ScrollView } from 'react-native';
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
import { usePublicPlans } from '../../../hooks/usePlans';

// Cast JS components as any to avoid fontWeight / prop type conflicts
const Screen = ScreenImport as any;
const Header = HeaderImport as any;
const Card = CardImport as any;
const PrimaryButton = PrimaryButtonImport as any;
const typography = themeTypography as any;

// Icon mapping for plan icons from backend
const PLAN_ICON_MAP: Record<string, string> = {
  crown: 'trophy',
  zap: 'flash',
  layers: 'layers',
  server: 'server',
  shield: 'shield-checkmark',
};

// Color mapping for plan accent colors
const PLAN_COLOR_MAP: Record<string, string> = {
  free: '#8E949A',
  basic: '#4B8CFF',
  pro: '#8A3FFC',
  enterprise: '#FFB648',
};

const getBillingLabel = (cycle: string): string => {
  switch (cycle) {
    case 'monthly': return '/month';
    case 'yearly': return '/year';
    case 'lifetime': return '/forever';
    default: return '';
  }
};

const formatPrice = (price: number, currency?: string): string => {
  if (price === 0) return '₹0';
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹';
  return `${symbol}${price.toLocaleString('en-IN')}`;
};

const SubscriptionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useDispatch<any>();
  const subscription = useSelector((state: any) => state.subscription);
  const { startSubscriptionPayment, isLoading } = usePayment();
  const { data: plans, isLoading: plansLoading, error: plansError, refetch } = usePublicPlans();

  const [selectedPlanSlug, setSelectedPlanSlug] = useState<string | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const isPremium = subscriptionService.isSubscriptionPro(subscription);
  const currentPlanSlug = subscription?.plan || 'free';

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

  const handleSubscribe = (plan: any) => {
    if (plan.price <= 0) return;
    Alert.alert(
      'Confirm Subscription',
      `Subscribe to ${plan.name} for ${formatPrice(plan.price, plan.currency)}${getBillingLabel(plan.billingCycle)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: () => startSubscriptionPayment(plan.slug, plan.name, plan.price),
        },
      ]
    );
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
      title="Subscription Plans"
      leftIcon={<Icon name="chevron-back" size={24} color={colors.text.primary} />}
      onLeftPress={() => navigation.goBack()}
    />
  );

  // Sort plans: free last, paid plans by price ascending
  const sortedPlans = React.useMemo(() => {
    if (!plans || !Array.isArray(plans)) return [];
    return [...plans].sort((a: any, b: any) => {
      if (a.price === 0 && b.price > 0) return 1;
      if (a.price > 0 && b.price === 0) return -1;
      return (a.displayOrder ?? a.price) - (b.displayOrder ?? b.price);
    });
  }, [plans]);

  const renderPlanCard = (plan: any) => {
    const isCurrentPlan = currentPlanSlug === plan.slug || 
      (currentPlanSlug === 'pro' && plan.slug === 'pro') ||
      (currentPlanSlug === 'basic' && plan.slug === 'basic');
    const isSelected = selectedPlanSlug === plan.slug;
    const isFree = plan.price === 0;
    const planColor = PLAN_COLOR_MAP[plan.slug] || plan.color || colors.primary;
    const planIcon = PLAN_ICON_MAP[plan.icon] || 'diamond';

    return (
      <Card
        key={plan._id}
        style={[
          styles.planCard,
          isSelected && { borderColor: planColor, backgroundColor: `${planColor}10` },
          isCurrentPlan && styles.currentPlanCard,
        ]}
        variant="solid"
      >
        {/* Plan Header */}
        <View style={styles.planHeader}>
          <View style={[styles.planIconContainer, { backgroundColor: `${planColor}20` }]}>
            <Icon name={planIcon} size={22} color={planColor} />
          </View>
          <View style={styles.planTitleContainer}>
            <Text style={styles.planName}>{plan.name}</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.planPrice, { color: planColor }]}>
                {formatPrice(plan.price, plan.currency)}
              </Text>
              <Text style={styles.billingCycle}>{getBillingLabel(plan.billingCycle)}</Text>
            </View>
          </View>
          {isCurrentPlan && (
            <View style={[styles.currentBadge, { backgroundColor: `${colors.success}20` }]}>
              <Text style={[styles.currentBadgeText, { color: colors.success }]}>CURRENT</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {plan.description ? (
          <Text style={styles.planDescription}>{plan.description}</Text>
        ) : null}

        {/* Quota Limits */}
        {plan.limits && (
          <View style={styles.limitsContainer}>
            <Text style={styles.limitsTitle}>Plan Quota Limits</Text>
            <View style={styles.limitRow}>
              <Icon name="chatbubbles-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.limitLabel}>Chatbot Queries</Text>
              <Text style={[styles.limitValue, { color: planColor }]}>
                {plan.limits.chatbotLimit === 0 ? '—' : plan.limits.chatbotLimit}
              </Text>
            </View>
            <View style={styles.limitRow}>
              <Icon name="scan-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.limitLabel}>Receipt Scans</Text>
              <Text style={[styles.limitValue, { color: planColor }]}>
                {plan.limits.receiptScannerLimit === 0 ? '—' : plan.limits.receiptScannerLimit}
              </Text>
            </View>
            <View style={styles.limitRow}>
              <Icon name="mic-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.limitLabel}>Voice Scanner</Text>
              <Text style={[styles.limitValue, { color: planColor }]}>
                {plan.limits.voiceScannerLimit === 0 ? '—' : plan.limits.voiceScannerLimit}
              </Text>
            </View>
          </View>
        )}

        {/* Features */}
        {plan.features && plan.features.length > 0 && (
          <View style={styles.featuresContainer}>
            {plan.features.map((feature: string, index: number) => (
              <View key={index} style={styles.featureRow}>
                <Icon name="checkmark-circle" size={16} color={planColor} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Button */}
        {!isCurrentPlan && !isFree && (
          <TouchableOpacity
            style={[styles.subscribeBtnCard, { backgroundColor: planColor }]}
            onPress={() => handleSubscribe(plan)}
            activeOpacity={0.8}
          >
            <Icon name="flash" size={16} color="#FFFFFF" />
            <Text style={styles.subscribeBtnText}>
              Subscribe — {formatPrice(plan.price, plan.currency)}
            </Text>
          </TouchableOpacity>
        )}

        {isCurrentPlan && isPremium && subscription.endDate && (
          <View style={styles.expiryRow}>
            <Icon name="time-outline" size={14} color={colors.text.secondary} />
            <Text style={styles.expiryText}>
              Expires: {subscriptionService.formatRenewalDate(subscription.endDate)}
            </Text>
          </View>
        )}

        {isCurrentPlan && isFree && (
          <View style={styles.freeInfoRow}>
            <Icon name="information-circle-outline" size={14} color={colors.text.secondary} />
            <Text style={styles.freeInfoText}>Your current plan</Text>
          </View>
        )}
      </Card>
    );
  };

  return (
    <Screen header={renderHeader()} scrollable={true} loading={isLoading}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        
        {/* Current Subscription Status */}
        <Card style={[styles.statusCard, isPremium ? styles.proStatus : styles.freeStatus]} variant="solid">
          <View style={styles.statusHeader}>
            <View style={styles.statusTitleRow}>
              <Icon
                name={isPremium ? 'ribbon' : 'person-circle-outline'}
                size={28}
                color={isPremium ? '#FFD700' : colors.text.secondary}
              />
              <Text style={styles.statusTitle}>
                {isPremium ? `${subscription.plan?.charAt(0).toUpperCase()}${subscription.plan?.slice(1)} Plan` : 'Free Plan'}
              </Text>
            </View>
            <View style={[styles.badge, isPremium ? styles.badgePro : styles.badgeFree]}>
              <Text style={styles.badgeText}>{isPremium ? 'ACTIVE' : 'FREE'}</Text>
            </View>
          </View>

          <Text style={styles.statusDesc}>
            {isPremium
              ? 'Thank you for supporting us! You have access to premium features based on your plan.'
              : 'Upgrade to a paid plan to unlock AI scanning, voice commands, cloud backups and more.'}
          </Text>

          {isPremium && subscription.endDate && (
            <View style={styles.statusExpiryRow}>
              <Icon name="time-outline" size={16} color={colors.text.secondary} />
              <Text style={styles.statusExpiryText}>
                Renews/Expires on: {subscriptionService.formatRenewalDate(subscription.endDate)}
              </Text>
            </View>
          )}
        </Card>

        {/* Plans List */}
        <Text style={styles.sectionTitle}>Available Plans</Text>

        {plansLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading plans...</Text>
          </View>
        )}

        {plansError && (
          <Card style={styles.errorCard} variant="solid">
            <Icon name="cloud-offline-outline" size={32} color={colors.danger} />
            <Text style={styles.errorText}>Could not load plans</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
              <Text style={styles.retryBtnText}>Tap to Retry</Text>
            </TouchableOpacity>
          </Card>
        )}

        {!plansLoading && !plansError && sortedPlans.length > 0 && (
          <View style={styles.plansList}>
            {sortedPlans.map((plan: any) => renderPlanCard(plan))}
          </View>
        )}

        {!plansLoading && !plansError && sortedPlans.length === 0 && (
          <Card style={styles.emptyCard} variant="solid">
            <Icon name="albums-outline" size={32} color={colors.text.muted} />
            <Text style={styles.emptyText}>No plans available at the moment</Text>
          </Card>
        )}

        {/* Restore Purchase */}
        <TouchableOpacity onPress={handleRestorePurchase} style={styles.restoreBtn}>
          <Text style={styles.restoreBtnText}>Restore Previous Purchase</Text>
        </TouchableOpacity>

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
  // ─── Current Status Card ─────────────────────────────
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
  statusExpiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
  },
  statusExpiryText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  // ─── Section Title ────────────────────────────────────
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  // ─── Plans List ───────────────────────────────────────
  plansList: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  planCard: {
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.divider,
  },
  currentPlanCard: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(138, 63, 252, 0.06)',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  planIconContainer: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  planTitleContainer: {
    flex: 1,
  },
  planName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: typography.sizes.lg + 2,
    fontWeight: typography.weights.heavy,
  },
  billingCycle: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginLeft: 2,
  },
  currentBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  planDescription: {
    fontSize: typography.sizes.sm - 1,
    color: colors.text.secondary,
    lineHeight: typography.lineHeights.sm,
    marginBottom: spacing.md,
  },
  // ─── Quota Limits ─────────────────────────────────────
  limitsContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  limitsTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  limitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: spacing.sm,
  },
  limitLabel: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  limitValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  // ─── Features ─────────────────────────────────────────
  featuresContainer: {
    marginBottom: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 3,
  },
  featureText: {
    fontSize: typography.sizes.xs,
    color: colors.text.primary,
    flex: 1,
  },
  // ─── Subscribe Button ─────────────────────────────────
  subscribeBtnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  subscribeBtnText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
  },
  // ─── Expiry / Info Rows ───────────────────────────────
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  expiryText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  freeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  freeInfoText: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
  },
  // ─── Loading / Error / Empty ──────────────────────────
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  errorCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 77, 103, 0.05)',
    marginBottom: spacing.lg,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    color: colors.danger,
    fontWeight: typography.weights.medium,
  },
  retryBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.danger,
    borderRadius: radius.md,
  },
  retryBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
  },
  // ─── Footer ───────────────────────────────────────────
  restoreBtn: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  restoreBtnText: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textDecorationLine: 'underline',
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
