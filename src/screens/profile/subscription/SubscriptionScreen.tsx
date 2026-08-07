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

// Map user currency symbol → ISO code
const SYMBOL_TO_CODE: Record<string, string> = {
  '₹': 'INR',
  '$': 'USD',
  '€': 'EUR',
  '£': 'GBP',
};

// Map ISO code → symbol
const CODE_TO_SYMBOL: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

// Rough conversion rates relative to INR (fallback if plan doesn't have user's currency)
const INR_RATES: Record<string, number> = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
};

const getBillingLabel = (cycle: string): string => {
  switch (cycle) {
    case 'monthly': return '/month';
    case 'yearly': return '/year';
    case 'lifetime': return '/forever';
    default: return '';
  }
};

const USD_RATES: Record<string, number> = {
  USD: 1,
  INR: 85.0,
  EUR: 0.92,
  GBP: 0.79,
};

const formatPrice = (price: number, planCurrency: string, userCurrencySymbol: string): string => {
  if (price === 0) return 'Free';

  // Determine user's active currency code ('INR', 'USD', etc.)
  let userCode = SYMBOL_TO_CODE[userCurrencySymbol] || userCurrencySymbol;
  if (!userCode || userCode === '₹') userCode = 'INR';
  if (userCode === '$') userCode = 'USD';

  const symbol = CODE_TO_SYMBOL[userCode] || (userCode === 'USD' ? '$' : '₹');

  // Base plan prices from backend database are in USD (e.g. 9, 19, 39)
  const baseCurrency = (planCurrency || 'USD').toUpperCase();

  let finalPrice = price;

  if (baseCurrency === 'USD' && userCode === 'INR') {
    // Convert $ USD base price to ₹ INR (1 USD = 85 INR)
    finalPrice = Math.round(price * 85.0);
  } else if (baseCurrency === 'USD' && userCode !== 'USD') {
    const rate = USD_RATES[userCode] || 85.0;
    finalPrice = Math.round(price * rate);
  } else if (baseCurrency === 'INR' && userCode === 'USD') {
    finalPrice = Math.round(price / 85.0);
  }

  return `${symbol}${finalPrice.toLocaleString('en-IN')}`;
};

const SubscriptionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useDispatch<any>();
  const subscription = useSelector((state: any) => state.subscription);
  const userCurrency = useSelector((state: any) => state.auth?.user?.currency || state.app?.currency || '₹');
  const { startSubscriptionPayment, isLoading } = usePayment();
  const { data: plans, isLoading: plansLoading, error: plansError, refetch } = usePublicPlans();

  const [selectedPlanSlug, setSelectedPlanSlug] = useState<string | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<any>(null); // { discountAmount, finalAmount, coupon }
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponPlanSlug, setCouponPlanSlug] = useState<string | null>(null); // which plan the coupon was validated for

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

  const handleApplyCoupon = async (planSlug: string) => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }
    setCouponLoading(true);
    setCouponError('');
    setCouponApplied(null);
    try {
      const result = await subscriptionService.validateCoupon(couponCode.trim().toUpperCase(), planSlug);
      setCouponApplied(result);
      setCouponPlanSlug(planSlug);
    } catch (err: any) {
      setCouponError(err.message || 'Invalid coupon code');
      setCouponApplied(null);
      setCouponPlanSlug(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponApplied(null);
    setCouponError('');
    setCouponPlanSlug(null);
  };

  const handleSubscribe = (plan: any) => {
    if (plan.price <= 0) return;

    const appliedCoupon = (couponApplied && couponPlanSlug === plan.slug) ? couponApplied : null;
    const displayPrice = appliedCoupon
      ? formatPrice(appliedCoupon.finalAmount, plan.currency, userCurrency)
      : formatPrice(plan.price, plan.currency, userCurrency);
    const couponLabel = appliedCoupon ? ` (Coupon: ${couponCode.toUpperCase()})` : '';

    Alert.alert(
      'Confirm Subscription',
      `Subscribe to ${plan.name} for ${displayPrice}${getBillingLabel(plan.billingCycle)}?${couponLabel}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: () => startSubscriptionPayment(
            plan.slug,
            plan.name,
            appliedCoupon ? appliedCoupon.finalAmount : plan.price,
            appliedCoupon ? couponCode.trim().toUpperCase() : undefined
          ),
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
                {formatPrice(plan.price, plan.currency, userCurrency)}
              </Text>
              <Text style={styles.billingCycle}>{getBillingLabel(plan.billingCycle)}</Text>
            </View>
          </View>
          {/* Currency badge */}
          <View style={[styles.currencyBadge, { backgroundColor: `${planColor}20` }]}>
            <Text style={[styles.currencyBadgeText, { color: planColor }]}>
              {SYMBOL_TO_CODE[userCurrency] || 'INR'}
            </Text>
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

        {/* Coupon Code Section — only for paid, non-current plans */}
        {!isCurrentPlan && !isFree && (
          <View style={styles.couponContainer}>
            <Text style={styles.couponLabel}>Have a Promo Code?</Text>
            <View style={styles.couponInputRow}>
              <View style={styles.couponInputWrapper}>
                <Icon name="pricetag-outline" size={16} color={colors.text.secondary} />
                <View style={{ flex: 1 }}>
                  {/* @ts-ignore - TextInput imported from react-native */}
                  <View style={styles.couponInputInner}>
                    <Text
                      style={[
                        styles.couponInput,
                        couponApplied && couponPlanSlug === plan.slug && styles.couponInputApplied,
                      ]}
                      onPress={() => {
                        // This is just a styled placeholder; actual input is via Alert.prompt or inline
                      }}
                    >
                      {couponCode || 'Enter code...'}
                    </Text>
                  </View>
                </View>
              </View>
              {couponApplied && couponPlanSlug === plan.slug ? (
                <TouchableOpacity
                  style={[styles.couponRemoveBtn]}
                  onPress={handleRemoveCoupon}
                  activeOpacity={0.7}
                >
                  <Icon name="close-circle" size={16} color={colors.danger} />
                  <Text style={styles.couponRemoveBtnText}>Remove</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.couponApplyBtn, { backgroundColor: `${planColor}20`, borderColor: planColor }]}
                  onPress={() => {
                    Alert.prompt(
                      'Enter Promo Code',
                      'Enter your coupon/promo code to get a discount:',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Apply',
                          onPress: (code?: string) => {
                            if (code) {
                              setCouponCode(code.toUpperCase());
                              setCouponError('');
                              setCouponApplied(null);
                              // Validate immediately
                              setCouponLoading(true);
                              subscriptionService.validateCoupon(code.trim().toUpperCase(), plan.slug)
                                .then((result: any) => {
                                  setCouponApplied(result);
                                  setCouponPlanSlug(plan.slug);
                                  setCouponCode(code.trim().toUpperCase());
                                })
                                .catch((err: any) => {
                                  setCouponError(err.message || 'Invalid coupon code');
                                  setCouponApplied(null);
                                  setCouponPlanSlug(null);
                                })
                                .finally(() => setCouponLoading(false));
                            }
                          },
                        },
                      ],
                      'plain-text',
                      couponCode
                    );
                  }}
                  activeOpacity={0.7}
                  disabled={couponLoading}
                >
                  {couponLoading ? (
                    <ActivityIndicator size="small" color={planColor} />
                  ) : (
                    <>
                      <Icon name="pricetag" size={14} color={planColor} />
                      <Text style={[styles.couponApplyBtnText, { color: planColor }]}>Apply</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Coupon Error */}
            {couponError && couponPlanSlug === plan.slug && (
              <View style={styles.couponErrorRow}>
                <Icon name="alert-circle" size={14} color={colors.danger} />
                <Text style={styles.couponErrorText}>{couponError}</Text>
              </View>
            )}

            {/* Coupon Success + Price Breakdown */}
            {couponApplied && couponPlanSlug === plan.slug && (
              <View style={styles.couponSuccessContainer}>
                <View style={styles.couponSuccessRow}>
                  <Icon name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={styles.couponSuccessText}>
                    {couponApplied.coupon?.discountValue}% OFF Applied!
                  </Text>
                </View>
                <View style={styles.priceBreakdown}>
                  <View style={styles.priceBreakdownRow}>
                    <Text style={styles.priceBreakdownLabel}>Original Price</Text>
                    <Text style={styles.priceBreakdownValue}>
                      {formatPrice(plan.price, plan.currency, userCurrency)}
                    </Text>
                  </View>
                  <View style={styles.priceBreakdownRow}>
                    <Text style={[styles.priceBreakdownLabel, { color: colors.success }]}>Discount</Text>
                    <Text style={[styles.priceBreakdownValue, { color: colors.success }]}>
                      -{formatPrice(couponApplied.discountAmount, plan.currency, userCurrency)}
                    </Text>
                  </View>
                  <View style={[styles.priceBreakdownRow, styles.priceBreakdownTotal]}>
                    <Text style={[styles.priceBreakdownLabel, { fontWeight: '700' as any }]}>You Pay</Text>
                    <Text style={[styles.priceBreakdownValue, { fontWeight: '700' as any, color: planColor }]}>
                      {formatPrice(couponApplied.finalAmount, plan.currency, userCurrency)}
                    </Text>
                  </View>
                </View>
              </View>
            )}
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
              {couponApplied && couponPlanSlug === plan.slug
                ? `Subscribe — ${formatPrice(couponApplied.finalAmount, plan.currency, userCurrency)}${getBillingLabel(plan.billingCycle)}`
                : `Subscribe — ${formatPrice(plan.price, plan.currency, userCurrency)}${getBillingLabel(plan.billingCycle)}`
              }
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
          <TouchableOpacity onPress={() => Alert.alert('Terms of Service', 'Standard Terms & Conditions apply for using Expenso subscriptions.')}>
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
  currencyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    marginLeft: spacing.xs,
  },
  currencyBadgeText: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.8,
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
  // ─── Coupon Styles ──────────────────────────────────
  couponContainer: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  couponLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.secondary,
    textTransform: 'uppercase' as any,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  couponInputRow: {
    flexDirection: 'row' as any,
    alignItems: 'center' as any,
    gap: spacing.sm,
  },
  couponInputWrapper: {
    flex: 1,
    flexDirection: 'row' as any,
    alignItems: 'center' as any,
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  couponInputInner: {
    flex: 1,
  },
  couponInput: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    fontFamily: 'monospace',
  },
  couponInputApplied: {
    color: colors.text.primary,
    fontWeight: typography.weights.bold,
  },
  couponApplyBtn: {
    flexDirection: 'row' as any,
    alignItems: 'center' as any,
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  couponApplyBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  couponRemoveBtn: {
    flexDirection: 'row' as any,
    alignItems: 'center' as any,
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  couponRemoveBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.danger,
  },
  couponErrorRow: {
    flexDirection: 'row' as any,
    alignItems: 'center' as any,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  couponErrorText: {
    fontSize: typography.sizes.xs,
    color: colors.danger,
  },
  couponSuccessContainer: {
    marginTop: spacing.sm,
  },
  couponSuccessRow: {
    flexDirection: 'row' as any,
    alignItems: 'center' as any,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  couponSuccessText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.success,
  },
  priceBreakdown: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  priceBreakdownRow: {
    flexDirection: 'row' as any,
    justifyContent: 'space-between' as any,
    alignItems: 'center' as any,
    paddingVertical: 3,
  },
  priceBreakdownLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  priceBreakdownValue: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  priceBreakdownTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    marginTop: 4,
    paddingTop: spacing.sm,
  },
  spacer: {
    height: 120,
  },
});

export default SubscriptionScreen;
