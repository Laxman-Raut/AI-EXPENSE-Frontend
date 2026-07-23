import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import PrimaryButtonImport from '../atoms/PrimaryButton';
import CardImport from '../molecules/Card';
import { colors, spacing, radius, typography as themeTypography } from '../../theme';
import { usePayment } from '../../hooks/usePayment';

const PrimaryButton = PrimaryButtonImport as any;
const Card = CardImport as any;
const typography = themeTypography as any;

interface SubscriptionPromoModalProps {
  visible: boolean;
  onClose: () => void;
}

const SubscriptionPromoModal: React.FC<SubscriptionPromoModalProps> = ({ visible, onClose }) => {
  const { startSubscriptionPayment, isLoading } = usePayment();
  const [selectedPlan, setSelectedPlan] = useState<'pro_monthly' | 'pro_yearly'>('pro_yearly');

  const handleSubscribe = async () => {
    onClose();
    await startSubscriptionPayment(selectedPlan);
  };

  const promoFeatures = [
    { title: 'AI Chat Assistant & Receipt Scanner', desc: 'Instant AI insights & unlimited receipt OCR' },
    { title: 'Automatic MongoDB Cloud Sync', desc: 'Secure real-time sync across all your devices' },
    { title: 'Voice Expense Logging', desc: 'Hands-free natural language transaction logging' },
    { title: 'PDF & Excel Export Sheets', desc: 'Export statement reports for tax & accounting' },
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
          
          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Icon name="close" size={22} color={colors.text.secondary} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Crown Header */}
            <View style={styles.header}>
              <LinearGradient
                colors={['#FFB648', '#FF6037']}
                style={styles.crownBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Icon name="ribbon" size={42} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.title}>Upgrade to Premium Pro 🎉</Text>
              <Text style={styles.subtitle}>
                Supercharge your finances with AI & secure Cloud Sync.
              </Text>
            </View>

            {/* Features List */}
            <View style={styles.featuresList}>
              {promoFeatures.map((feat, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={styles.checkIconWrapper}>
                    <Icon name="checkmark-circle" size={22} color={colors.success} />
                  </View>
                  <View style={styles.featureTextWrapper}>
                    <Text style={styles.featureTitle}>{feat.title}</Text>
                    <Text style={styles.featureDesc}>{feat.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Plan Selector */}
            <View style={styles.planSelectorRow}>
              {/* Yearly Card */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.planCard,
                  selectedPlan === 'pro_yearly' ? styles.selectedPlanCard : null,
                ]}
                onPress={() => setSelectedPlan('pro_yearly')}
              >
                <View style={styles.discountBadge}>
                  <Text style={styles.discountBadgeText}>Save 16%</Text>
                </View>
                <Text style={styles.planPeriod}>Yearly Access</Text>
                <Text style={styles.planPrice}>₹1,999</Text>
                <Text style={styles.planSubprice}>₹166/mo</Text>
              </TouchableOpacity>

              {/* Monthly Card */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.planCard,
                  selectedPlan === 'pro_monthly' ? styles.selectedPlanCard : null,
                ]}
                onPress={() => setSelectedPlan('pro_monthly')}
              >
                <Text style={styles.planPeriod}>Monthly Access</Text>
                <Text style={styles.planPrice}>₹199</Text>
                <Text style={styles.planSubprice}>Cancel anytime</Text>
              </TouchableOpacity>
            </View>

            {/* CTA Buttons */}
            <PrimaryButton
              title={`Subscribe Now - ${selectedPlan === 'pro_yearly' ? '₹1,999/yr' : '₹199/mo'}`}
              type="primary"
              onPress={handleSubscribe}
              loading={isLoading}
              style={styles.subscribeBtn}
              icon={<Icon name="flash" size={18} color="#FFFFFF" />}
            />

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
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl * 1.5,
    borderTopRightRadius: radius.xl * 1.5,
    borderWidth: 1,
    borderColor: colors.divider,
    maxHeight: '90%',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  crownBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    shadowColor: '#FFB648',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.lineHeights.sm + 2,
  },
  featuresList: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkIconWrapper: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  featureTextWrapper: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  featureDesc: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  planSelectorRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
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
    backgroundColor: 'rgba(138, 63, 252, 0.1)',
  },
  discountBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  discountBadgeText: {
    fontSize: 9,
    fontWeight: typography.weights.bold,
    color: colors.background,
    textTransform: 'uppercase',
  },
  planPeriod: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  planPrice: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginVertical: 2,
  },
  planSubprice: {
    fontSize: 9,
    color: colors.text.secondary,
  },
  subscribeBtn: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  maybeLaterBtn: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
  },
  maybeLaterText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
});

export default SubscriptionPromoModal;
