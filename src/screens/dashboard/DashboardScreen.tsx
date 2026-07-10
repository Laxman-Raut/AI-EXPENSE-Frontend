import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import GradientBackground from '../../components/common/GradientBackground';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import { useDashboardSummary, useRecentTransactions, useMonthlyAnalytics } from '../../hooks/useDashboard';
import { Colors, Typography, Spacing } from '../../theme';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { Transaction, MonthlyAnalytics } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Mock data to ensure design is gorgeous even if backend database is empty
const DEFAULT_ANALYTICS = [
  { month: 'Jan', value: 1494 },
  { month: 'Feb', value: 1664 },
  { month: 'Mar', value: 1544 },
  { month: 'Apr', value: 2972, isHighlighted: true },
  { month: 'May', value: 2484 },
  { month: 'Jun', value: 2364 },
  { month: 'Jul', value: 3894 },
];

const DashboardScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuth();
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useDashboardSummary();
  const { data: recentTxns, isLoading: recentLoading, refetch: refetchRecent } = useRecentTransactions();
  const { data: analytics, refetch: refetchAnalytics } = useMonthlyAnalytics();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2022');

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchSummary(), refetchRecent(), refetchAnalytics()]);
    setRefreshing(false);
  };

  if (summaryLoading && !summary) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  // Determine actual chart data to display based on backend hook or mockup fallback
  const getChartData = () => {
    if (analytics && analytics.length > 0) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return analytics.slice(0, 7).map((item: MonthlyAnalytics, idx: number) => {
        const mIdx = item._id.month - 1;
        const name = monthNames[mIdx] || `M${item._id.month}`;
        // Highlight April by default or active month
        return {
          month: name,
          value: item.expense || 1,
          isHighlighted: name === 'Apr',
        };
      });
    }
    return DEFAULT_ANALYTICS;
  };

  const chartData = getChartData();
  const maxVal = Math.max(...chartData.map((d) => d.value), 1);

  // Helper for brand logo/initial placeholder
  const getMerchantInitial = (description: string) => {
    return (description || 'T').trim().charAt(0).toUpperCase();
  };

  // Helper to color brand placeholders
  const getMerchantBgColor = (description: string) => {
    const desc = (description || '').toLowerCase();
    if (desc.includes('puma')) return '#000000';
    if (desc.includes('nike')) return '#1A1A1A';
    if (desc.includes('food') || desc.includes('restaurant')) return '#FFEDEB';
    if (desc.includes('rent') || desc.includes('home')) return '#EBF3FF';
    return '#F1F3F9';
  };

  const getMerchantTextColor = (description: string) => {
    const desc = (description || '').toLowerCase();
    if (desc.includes('puma') || desc.includes('nike')) return '#FFFFFF';
    return Colors.textPrimary;
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.accent}
              colors={[Colors.accent]}
            />
          }
          contentContainerStyle={styles.scrollContent}>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.navigate('ProfileTab')} style={styles.avatarButton}>
              <LinearGradient
                colors={['#8A3FFC', '#6D3BFF']}
                style={styles.avatarGradient}>
                <Text style={styles.avatarText}>
                  {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Home</Text>
            <TouchableOpacity style={styles.notificationBtn}>
              <Icon name="notifications-outline" size={24} color={Colors.textPrimary} />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
          </View>

          {/* Balance Card */}
          <View style={styles.cardContainer}>
            <LinearGradient
              colors={[Colors.mockupBalanceStart, Colors.mockupBalanceEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceCard}>
              
              {/* Background waves drawn with SVG for high-fidelity replication */}
              <View style={styles.cardWaveOverlay}>
                <Svg height="100%" width="100%" viewBox="0 0 350 200">
                  <Path
                    d="M0,50 Q90,150 180,60 T350,110 L350,200 L0,200 Z"
                    fill="rgba(255, 255, 255, 0.03)"
                  />
                  <Path
                    d="M0,100 Q100,50 200,120 T350,40 L350,200 L0,200 Z"
                    fill="rgba(255, 255, 255, 0.02)"
                  />
                </Svg>
              </View>

              <View style={styles.cardHeader}>
                <Text style={styles.balanceLabel}>Total Balance</Text>
                <TouchableOpacity>
                  <Icon name="ellipsis-horizontal" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <Text style={styles.balanceAmount}>
                {formatCurrency(summary?.balance || 59765)}
              </Text>

              <View style={styles.cardFooter}>
                <Text style={styles.cardNumber}>2644  7545  3867  1965</Text>
                <View style={styles.mastercardContainer}>
                  {/* Two overlapping circles for Mastercard logo */}
                  <View style={[styles.mcCircle, { backgroundColor: '#FF5F38', zIndex: 1 }]} />
                  <View style={[styles.mcCircle, { backgroundColor: '#FFAA00', marginLeft: -12, opacity: 0.85 }]} />
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Analytics Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Analytics</Text>
              <TouchableOpacity style={styles.filterDropdown} activeOpacity={0.8}>
                <Text style={styles.filterText}>Year - {selectedYear}</Text>
                <Icon name="chevron-down" size={14} color="#FFFFFF" style={styles.filterChevron} />
              </TouchableOpacity>
            </View>

            {/* Custom Bar Chart with high visual layout accuracy */}
            <View style={styles.chartCard}>
              {/* Subtle Grid Lines overlay */}
              <View style={styles.gridLinesContainer}>
                <View style={styles.gridLine} />
                <View style={styles.gridLine} />
                <View style={styles.gridLine} />
              </View>

              <View style={styles.barChartContainer}>
                {chartData.map((item, index) => {
                  // Max height of bar is 120dp
                  const barHeight = (item.value / maxVal) * 110;
                  const isHighlighted = item.isHighlighted;

                  return (
                    <View key={index} style={styles.barColumn}>
                      {/* Amount above the bar */}
                      <Text
                        style={[
                          styles.barValueText,
                          isHighlighted ? styles.barValueHighlightedText : null,
                        ]}>
                        ${item.value}
                      </Text>

                      {/* The Bar */}
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            { height: Math.max(barHeight, 8) },
                            isHighlighted ? styles.barFillHighlighted : null,
                          ]}
                        />
                      </View>

                      {/* Month label */}
                      <Text
                        style={[
                          styles.barMonthLabel,
                          isHighlighted ? styles.barMonthHighlightedLabel : null,
                        ]}>
                        {item.month}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Transactions Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Transactions</Text>
              <TouchableOpacity onPress={() => navigation.navigate('TransactionsTab')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {recentLoading && !recentTxns ? (
              <View style={styles.loadingWrapper}>
                <LoadingSpinner message="" />
              </View>
            ) : !recentTxns || recentTxns.length === 0 ? (
              /* High-fidelity Fallback items (styled like Puma Store / Nike Store in mockup) */
              <View style={styles.txListContainer}>
                <TouchableOpacity style={styles.txnItem} activeOpacity={0.7} onPress={() => navigation.navigate('TransactionsTab')}>
                  <View style={[styles.merchantLogoContainer, { backgroundColor: '#000000' }]}>
                    <Text style={[styles.merchantInitial, { color: '#FFFFFF', fontWeight: '900', fontSize: 13 }]}>PUMA</Text>
                  </View>
                  <View style={styles.txnInfo}>
                    <Text style={styles.txnName}>Puma Store</Text>
                    <Text style={styles.txnDetails}>Bank Account • Fri, 05 April 2022</Text>
                  </View>
                  <Text style={[styles.txnAmount, { color: '#10B981' }]}>+$952</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.txnItem} activeOpacity={0.7} onPress={() => navigation.navigate('TransactionsTab')}>
                  <View style={[styles.merchantLogoContainer, { backgroundColor: '#1A1A1A' }]}>
                    <Text style={[styles.merchantInitial, { color: '#FFFFFF', fontStyle: 'italic', fontWeight: 'bold' }]}>N</Text>
                  </View>
                  <View style={styles.txnInfo}>
                    <Text style={styles.txnName}>Nike Super Store</Text>
                    <Text style={styles.txnDetails}>Credit Card • Fri, 05 April 2022</Text>
                  </View>
                  <Text style={[styles.txnAmount, { color: '#10B981' }]}>+$475</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.txListContainer}>
                {recentTxns.slice(0, 4).map((txn: Transaction) => (
                  <TouchableOpacity
                    key={txn._id}
                    onPress={() => navigation.navigate('TransactionDetail', { id: txn._id })}
                    style={styles.txnItem}
                    activeOpacity={0.7}>
                    <View
                      style={[
                        styles.merchantLogoContainer,
                        { backgroundColor: getMerchantBgColor(txn.description) },
                      ]}>
                      <Text
                        style={[
                          styles.merchantInitial,
                          { color: getMerchantTextColor(txn.description) },
                        ]}>
                        {getMerchantInitial(txn.description)}
                      </Text>
                    </View>
                    <View style={styles.txnInfo}>
                      <Text style={styles.txnName} numberOfLines={1}>
                        {txn.description}
                      </Text>
                      <Text style={styles.txnDetails}>
                        {txn.paymentMethod} • {formatDate(txn.transactionDate)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.txnAmount,
                        { color: txn.type === 'income' ? '#10B981' : '#F43F5E' },
                      ]}>
                      {txn.type === 'income' ? '+' : '-'}
                      {formatCurrency(txn.amount)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  avatarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  notificationBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  cardContainer: {
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  balanceCard: {
    height: 196,
    borderRadius: 24,
    padding: 24,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#1C1E3A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  cardWaveOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  balanceLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    zIndex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  cardNumber: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    letterSpacing: 1.5,
  },
  mastercardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mcCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6037', // Mockup orange background capsule
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  filterText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 11,
  },
  filterChevron: {
    marginLeft: 6,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    position: 'relative',
  },
  gridLinesContainer: {
    position: 'absolute',
    top: 52,
    left: 16,
    right: 16,
    height: 110,
    justifyContent: 'space-between',
    zIndex: 0,
  },
  gridLine: {
    height: 1,
    backgroundColor: '#F5F5FA',
    width: '100%',
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    paddingTop: 20,
    zIndex: 1,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barValueText: {
    fontSize: 8,
    color: Colors.textMuted,
    marginBottom: 6,
    fontWeight: '500',
  },
  barValueHighlightedText: {
    color: '#8A3FFC',
    fontWeight: '700',
    fontSize: 9,
  },
  barTrack: {
    height: 110,
    justifyContent: 'flex-end',
    width: 14,
    borderRadius: 7,
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: 'rgba(138, 63, 252, 0.06)', // soft violet tint
    borderRadius: 7,
  },
  barFillHighlighted: {
    backgroundColor: '#8A3FFC', // Mockup highlighted purple bar
  },
  barMonthLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 8,
    fontWeight: '500',
  },
  barMonthHighlightedLabel: {
    color: '#8A3FFC',
    fontWeight: '700',
  },
  viewAllText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  txListContainer: {
    gap: 12,
  },
  txnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
  },
  merchantLogoContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  merchantInitial: {
    fontSize: 16,
    fontWeight: '700',
  },
  txnInfo: {
    flex: 1,
  },
  txnName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  txnDetails: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  txnAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  loadingWrapper: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DashboardScreen;
