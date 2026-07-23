import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenImport from '../../../components/templates/Screen';
import HeaderImport from '../../../components/molecules/Header';
import CardImport from '../../../components/molecules/Card';
import { colors, spacing, typography as themeTypography, radius } from '../../../theme';

const Screen = ScreenImport as any;
const Header = HeaderImport as any;
const Card = CardImport as any;
const typography = themeTypography as any;

interface PremiumFeature {
  id: string;
  title: string;
  desc: string;
  icon: string;
  gradientColors: string[];
}

const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    id: 'ai_assistant',
    title: 'AI Chat Assistant',
    desc: 'Get real-time insights on your spending, budget suggestions, and financial queries answered instantly by our advanced LLM trained on smart ledgers.',
    icon: 'chatbubble-ellipses',
    gradientColors: ['#8A3FFC', '#5E1BDB'],
  },
  {
    id: 'receipt_scanner',
    title: 'AI Receipt Scanner',
    desc: 'Scan paper receipts with high-precision OCR that automatically extracts vendor name, items, tax, and amounts, categorizing them without manual input.',
    icon: 'scan',
    gradientColors: ['#00D26A', '#009E4F'],
  },
  {
    id: 'voice_transactions',
    title: 'Voice Transactions',
    desc: 'Simply speak to record transactions. Our natural language processing engine parses commands like "spent fifty rupees on coffee" into perfect transaction logs.',
    icon: 'mic',
    gradientColors: ['#FF6037', '#D84B20'],
  },
  {
    id: 'cloud_sync',
    title: 'Secure Cloud Sync',
    desc: 'Never lose your records. Real-time automatic encrypted backups to our secure database let you access your expense tracker on multiple devices simultaneously.',
    icon: 'cloud-done',
    gradientColors: ['#4B8CFF', '#1B65DB'],
  },
  {
    id: 'advanced_reports',
    title: 'Advanced Data Export',
    desc: 'Generate premium financial statement sheets. Export filtered transaction histories in PDF, CSV, or formatted Microsoft Excel spreadsheets for taxes.',
    icon: 'document-attach',
    gradientColors: ['#FFB648', '#C38210'],
  },
  {
    id: 'ad_free',
    title: 'Ad-free Experience',
    desc: 'Focus entirely on optimizing your wealth. Zero distractions, banner ads, or promotional content popups—only clean personal finance tracking.',
    icon: 'shield-checkmark',
    gradientColors: ['#FF4D67', '#C31B37'],
  },
];

const PremiumFeaturesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const renderHeader = () => (
    <Header
      title="Premium Features"
      leftIcon={<Icon name="chevron-back" size={24} color={colors.text.primary} />}
      onLeftPress={() => navigation.goBack()}
    />
  );

  const handleFeaturePress = (featureId: string) => {
    switch (featureId) {
      case 'receipt_scanner':
        navigation.navigate('Today', { screen: 'ReceiptScanner' });
        break;
      case 'voice_transactions':
        navigation.navigate('Today', { screen: 'AddTransaction' });
        break;
      default:
        navigation.navigate('Today', { screen: 'TodayHome' });
        break;
    }
  };

  const renderFeatureItem = ({ item }: { item: PremiumFeature }) => (
    <TouchableOpacity activeOpacity={0.8} onPress={() => handleFeaturePress(item.id)}>
      <Card style={styles.featureCard} variant="solid">
        <View style={styles.cardHeader}>
          <LinearGradient
            colors={item.gradientColors}
            style={styles.iconContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name={item.icon} size={28} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.featureTitle}>{item.title}</Text>
          <Icon name="chevron-forward" size={20} color={colors.text.secondary} />
        </View>
        <Text style={styles.featureDesc}>{item.desc}</Text>
      </Card>
    </TouchableOpacity>
  );

  return (
    <Screen header={renderHeader()} scrollable={false}>
      <FlatList
        data={PREMIUM_FEATURES}
        keyExtractor={(item) => item.id}
        renderItem={renderFeatureItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerInfo}>
            <Icon name="ribbon" size={56} color="#FFD700" style={styles.badgeIcon} />
            <Text style={styles.title}>All-Inclusive Access</Text>
            <Text style={styles.subtitle}>
              Uncompromising tracking capacity and artificial intelligence to automate your financial records.
            </Text>
          </View>
        }
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl * 2,
  },
  headerInfo: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  badgeIcon: {
    marginBottom: spacing.sm,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.lineHeights.sm + 2,
    paddingHorizontal: spacing.md,
  },
  featureCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderColor: colors.divider,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  featureTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    flex: 1,
  },
  featureDesc: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: typography.lineHeights.sm + 3,
  },
});

export default PremiumFeaturesScreen;
