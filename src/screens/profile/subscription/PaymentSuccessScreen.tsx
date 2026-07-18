import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenImport from '../../../components/templates/Screen';
import CardImport from '../../../components/molecules/Card';
import PrimaryButtonImport from '../../../components/atoms/PrimaryButton';
import { colors, spacing, typography as themeTypography, radius } from '../../../theme';

const Screen = ScreenImport as any;
const Card = CardImport as any;
const PrimaryButton = PrimaryButtonImport as any;
const typography = themeTypography as any;

const { width } = Dimensions.get('window');

interface PaymentSuccessScreenProps {
  navigation: any;
  route: {
    params?: {
      planName?: string;
      amount?: string;
      orderId?: string;
      paymentId?: string;
      endDate?: string;
    };
  };
}

const PaymentSuccessScreen: React.FC<PaymentSuccessScreenProps> = ({ navigation, route }) => {
  const planName = route.params?.planName || 'Pro Subscription';
  const amount = route.params?.amount || '₹199';
  const orderId = route.params?.orderId || 'N/A';
  const paymentId = route.params?.paymentId || 'N/A';
  const expiryDate = route.params?.endDate ? new Date(route.params.endDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }) : 'N/A';

  return (
    <Screen scrollable safeAreaStyle={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        
        {/* Celebration Icon Header */}
        <View style={styles.successIconHeader}>
          <LinearGradient
            colors={['#00D26A', '#009E4F']}
            style={styles.gradientBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name="checkmark" size={54} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.successTitle}>Upgrade Successful! 🎉</Text>
          <Text style={styles.successSubtitle}>Welcome to Premium. All smart features are now unlocked.</Text>
        </View>

        {/* Transaction Detail Receipt */}
        <Card style={styles.receiptCard} variant="solid">
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Plan Purchased</Text>
            <Text style={styles.receiptValue}>{planName}</Text>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Amount Paid</Text>
            <Text style={[styles.receiptValue, styles.amountText]}>{amount}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Valid Until</Text>
            <Text style={styles.receiptValue}>{expiryDate}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Order ID</Text>
            <Text style={styles.receiptValue} numberOfLines={1} ellipsizeMode="tail">
              {orderId}
            </Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Payment ID</Text>
            <Text style={styles.receiptValue} numberOfLines={1} ellipsizeMode="tail">
              {paymentId}
            </Text>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="Explore Premium Features"
            type="primary"
            onPress={() => navigation.navigate('PremiumFeatures')}
            style={styles.btn}
            icon={<Icon name="ribbon-outline" size={20} color="#FFFFFF" />}
          />
          <PrimaryButton
            title="Go to Dashboard"
            type="outline"
            onPress={() => navigation.navigate('TodayHome')}
            style={[styles.btn, styles.secondaryBtn]}
            textStyle={styles.secondaryBtnText}
          />
        </View>

      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  successIconHeader: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  gradientBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: '#00D26A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  successTitle: {
    fontSize: typography.sizes.xl + 4,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  successSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.lineHeights.sm + 2,
    paddingHorizontal: spacing.xl,
  },
  receiptCard: {
    width: '100%',
    padding: spacing.xl,
    backgroundColor: colors.card,
    borderColor: colors.divider,
    borderWidth: 1,
    borderRadius: radius.lg,
    marginBottom: spacing.xxl,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  receiptLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  receiptValue: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontWeight: typography.weights.semibold,
    maxWidth: width * 0.5,
    textAlign: 'right',
  },
  amountText: {
    color: colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    width: '100%',
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.md,
  },
  btn: {
    width: '100%',
  },
  secondaryBtn: {
    borderColor: colors.divider,
  },
  secondaryBtnText: {
    color: colors.text.secondary,
  },
});

export default PaymentSuccessScreen;
