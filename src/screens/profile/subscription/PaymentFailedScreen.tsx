import React from 'react';
import { View, Text, StyleSheet, Linking, Alert } from 'react-native';
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

interface PaymentFailedScreenProps {
  navigation: any;
  route: {
    params?: {
      errorMessage?: string;
      orderId?: string;
    };
  };
}

const PaymentFailedScreen: React.FC<PaymentFailedScreenProps> = ({ navigation, route }) => {
  const errorMessage = route.params?.errorMessage || 'The transaction was cancelled or declined by your bank.';
  const orderId = route.params?.orderId || 'N/A';

  const handleContactSupport = () => {
    const email = 'support@aiexpensetracker.com';
    const subject = `Payment issue - Order ID: ${orderId}`;
    const body = `Hi Support Team,\n\nI tried to upgrade to Pro but my payment failed.\nOrder ID: ${orderId}\nError Details: ${errorMessage}\n\nPlease help.`;
    
    Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
      .catch(() => {
        Alert.alert('Support Email', `Could not open mail app. Please send an email to ${email} with Order ID ${orderId}`);
      });
  };

  return (
    <Screen safeAreaStyle={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        
        {/* Error Badge */}
        <View style={styles.failedHeader}>
          <LinearGradient
            colors={[colors.danger, '#C31B37']}
            style={styles.gradientBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name="close" size={54} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.failedTitle}>Payment Failed</Text>
          <Text style={styles.failedSubtitle}>We were unable to process your subscription upgrade.</Text>
        </View>

        {/* Error Details Card */}
        <Card style={styles.errorCard} variant="solid">
          <Text style={styles.detailsTitle}>Error Details</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          
          {orderId !== 'N/A' && (
            <View style={styles.orderIdContainer}>
              <Text style={styles.orderIdLabel}>Order ID: </Text>
              <Text style={styles.orderIdValue} selectable>{orderId}</Text>
            </View>
          )}
        </Card>

        {/* Help Info Card */}
        <Card style={styles.supportCard} variant="outlined">
          <Icon name="information-circle" size={24} color={colors.primary} style={styles.supportIcon} />
          <View style={styles.supportTextContainer}>
            <Text style={styles.supportTitle}>Need assistance?</Text>
            <Text style={styles.supportDesc}>
              No funds will be debited for failed orders. If money was deducted, it will be refunded within 3-5 business days.
            </Text>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="Try Again"
            type="primary"
            onPress={() => navigation.goBack()}
            style={styles.btn}
            icon={<Icon name="refresh" size={20} color="#FFFFFF" />}
          />
          <PrimaryButton
            title="Contact Support"
            type="outline"
            onPress={handleContactSupport}
            style={[styles.btn, styles.supportBtn]}
            textStyle={styles.supportBtnText}
            icon={<Icon name="mail-outline" size={20} color={colors.text.secondary} />}
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
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  failedHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  gradientBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  failedTitle: {
    fontSize: typography.sizes.xl + 4,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  failedSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.lineHeights.sm + 2,
    paddingHorizontal: spacing.xl,
  },
  errorCard: {
    width: '100%',
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderColor: colors.divider,
    borderWidth: 1,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  detailsTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    lineHeight: typography.lineHeights.sm + 2,
    marginBottom: spacing.sm,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  orderIdLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  orderIdValue: {
    fontSize: typography.sizes.xs,
    color: colors.text.primary,
    fontWeight: typography.weights.semibold,
  },
  supportCard: {
    width: '100%',
    flexDirection: 'row',
    padding: spacing.md,
    borderColor: colors.divider,
    borderRadius: radius.lg,
    marginBottom: spacing.xl,
    alignItems: 'flex-start',
  },
  supportIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  supportTextContainer: {
    flex: 1,
  },
  supportTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  supportDesc: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    lineHeight: typography.lineHeights.xs + 2,
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.md,
  },
  btn: {
    width: '100%',
  },
  supportBtn: {
    borderColor: colors.divider,
  },
  supportBtnText: {
    color: colors.text.secondary,
  },
});

export default PaymentFailedScreen;
