import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import PrimaryButtonImport from '../atoms/PrimaryButton';
import { colors, spacing, radius, typography as themeTypography } from '../../theme';

const PrimaryButton = PrimaryButtonImport as any;
const typography = themeTypography as any;

interface SubscriptionPromoModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToPlans?: () => void;
}

const SubscriptionPromoModal: React.FC<SubscriptionPromoModalProps> = ({
  visible,
  onClose,
  onNavigateToPlans,
}) => {
  const navigation = useNavigation<any>();

  const handleExploreAll = () => {
    onClose();
    if (onNavigateToPlans) {
      onNavigateToPlans();
    } else {
      try {
        navigation.navigate('Subscription');
      } catch {
        try {
          navigation.navigate('Profile', { screen: 'Subscription' });
        } catch (err) {
          console.warn('Navigation to Subscription failed:', err);
        }
      }
    }
  };

  const promoFeatures = [
    {
      icon: 'sparkles-sharp',
      iconBg: '#8A3FFC20',
      iconColor: '#8A3FFC',
      title: 'AI Receipt Scanner & Smart Assistant',
      desc: 'Instant receipt OCR scanning & AI financial advice',
    },
    {
      icon: 'cloud-upload-sharp',
      iconBg: '#007AFF20',
      iconColor: '#007AFF',
      title: 'Automatic MongoDB Cloud Sync',
      desc: 'Secure real-time sync across all your devices',
    },
    {
      icon: 'mic-sharp',
      iconBg: '#FF2D5520',
      iconColor: '#FF2D55',
      title: 'Voice Expense & Income Logging',
      desc: 'Hands-free natural language transaction entry',
    },
    {
      icon: 'document-text-sharp',
      iconBg: '#34C75920',
      iconColor: '#34C759',
      title: 'PDF & Excel Statement Exports',
      desc: 'Download statement reports for tax & accounting',
    },
    {
      icon: 'notifications-sharp',
      iconBg: '#FF950020',
      iconColor: '#FF9500',
      title: 'Smart Automation & Bill Reminders',
      desc: 'Never miss recurring transactions or split payments',
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Top handle indicator */}
          <View style={styles.handleBar} />

          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Icon name="close" size={20} color={colors.text.secondary} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Crown Header */}
            <View style={styles.header}>
              <View style={styles.crownGlowWrapper}>
                <LinearGradient
                  colors={['#8A3FFC', '#6700EB']}
                  style={styles.crownBadge}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Icon name="trophy" size={38} color="#FFFFFF" />
                </LinearGradient>
              </View>

              <View style={styles.offerTag}>
                <Icon name="sparkles" size={12} color="#8A3FFC" style={{ marginRight: 4 }} />
                <Text style={styles.offerTagText}>UPGRADE TO PRO</Text>
              </View>

              <Text style={styles.title}>Unlock Full AI Power 🚀</Text>
              <Text style={styles.subtitle}>
                Supercharge your financial tracking with instant AI Receipt Scanner, Cloud Sync & Voice Logging.
              </Text>
            </View>

            {/* Features List */}
            <View style={styles.featuresList}>
              {promoFeatures.map((feat, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={[styles.iconWrapper, { backgroundColor: feat.iconBg }]}>
                    <Icon name={feat.icon} size={18} color={feat.iconColor} />
                  </View>
                  <View style={styles.featureTextWrapper}>
                    <Text style={styles.featureTitle}>{feat.title}</Text>
                    <Text style={styles.featureDesc}>{feat.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Promo message */}
            <Text style={styles.promoMsgText}>
              To access these premium features, explore our flexible subscription plans.
            </Text>

            {/* Main CTA Button */}
            <PrimaryButton
              title="Explore Plans & Features"
              type="primary"
              onPress={handleExploreAll}
              style={styles.exploreBtn}
              icon={<Icon name="arrow-forward" size={18} color="#FFFFFF" />}
            />

            {/* Maybe Later Button */}
            <TouchableOpacity onPress={onClose} style={styles.maybeLaterBtn}>
              <Text style={styles.maybeLaterText}>Maybe Later</Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl * 1.5,
    borderTopRightRadius: radius.xl * 1.5,
    borderWidth: 1,
    borderColor: colors.divider,
    maxHeight: '92%',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.divider,
    alignSelf: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  crownGlowWrapper: {
    shadowColor: '#8A3FFC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
    marginBottom: spacing.xs,
  },
  crownBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8A3FFC15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: '#8A3FFC30',
  },
  offerTagText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.xs + 1,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.sm,
  },
  featuresList: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  featureTextWrapper: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: 1,
  },
  featureDesc: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  sectionLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  planSelectorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  planCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.divider,
    padding: spacing.md,
    position: 'relative',
    alignItems: 'center',
  },
  selectedPlanCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  discountBadge: {
    position: 'absolute',
    top: -11,
    paddingHorizontal: spacing.sm - 2,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  discountBadgeText: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  invisibleBadge: {
    position: 'absolute',
    top: -11,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm - 2,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  invisibleBadgeText: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    color: colors.text.muted,
    textTransform: 'uppercase',
  },
  planPeriod: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  planPrice: {
    fontSize: typography.sizes.lg + 2,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginVertical: 2,
  },
  planSubprice: {
    fontSize: 10,
    color: colors.text.secondary,
  },
  subscribeBtn: {
    width: '100%',
    marginBottom: spacing.xs,
  },
  exploreAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs + 2,
    gap: 4,
  },
  exploreAllText: {
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  maybeLaterBtn: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
  },
  maybeLaterText: {
    fontSize: typography.sizes.xs + 1,
    color: colors.text.muted,
  },
  trustFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
    gap: 4,
  },
  trustText: {
    fontSize: 10,
    color: colors.text.muted,
  },
  promoMsgText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  exploreBtn: {
    width: '100%',
    marginBottom: spacing.xs,
  },
});

export default SubscriptionPromoModal;
