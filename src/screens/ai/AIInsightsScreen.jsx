import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

import GradientBackground from '../../components/common/GradientBackground';
import GlassCard from '../../components/Card/GlassCard';
import Loader from '../../components/Loader/Loader';
import { fetchAIInsights } from '../../api/ai';
import { Colors, Typography, Spacing } from '../../theme';
import useAppStore from '../../store/useAppStore';

const AIInsightsScreen = () => {
  const theme = useAppStore((state) => state.theme);
  const currency = useAppStore((state) => state.currency);
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [insights, setInsights] = useState(null);

  const loadData = async () => {
    try {
      const response = await fetchAIInsights();
      if (response.success) {
        setInsights(response.data);
      }
    } catch (error) {
      console.error('Error loading AI insights:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading || !insights) {
    return <Loader message="Compiling AI predictions..." />;
  }

  // Circular Gauge Math
  const radius = 50;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (insights.healthScore / 100) * circumference;

  const getHealthLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Action Needed';
  };

  const getHealthColor = (score) => {
    if (score >= 80) return Colors.income || '#22C55E';
    if (score >= 60) return Colors.warning || '#F59E0B';
    return Colors.expense || '#EF4444';
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#111827' }]}>AI Insights</Text>
          <View style={styles.headerIcon}>
            <Icon name="sparkles" size={20} color="#8B5CF6" />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.content}>
          
          {/* Radial Health Gauge */}
          <GlassCard style={styles.healthCard} variant="elevated">
            <View style={styles.gaugeContainer}>
              <Svg height={radius * 2} width={radius * 2}>
                {/* Background Ring */}
                <Circle
                  stroke="rgba(255, 255, 255, 0.08)"
                  fill="transparent"
                  strokeWidth={stroke}
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                />
                {/* Foreground Score Ring */}
                <Circle
                  stroke={getHealthColor(insights.healthScore)}
                  fill="transparent"
                  strokeWidth={stroke}
                  strokeDasharray={circumference + ' ' + circumference}
                  style={{ strokeDashoffset }}
                  strokeLinecap="round"
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                  transform={`rotate(-90 ${radius} ${radius})`}
                />
                <SvgText
                  x="50%"
                  y="55%"
                  textAnchor="middle"
                  fill={isDark ? '#FFFFFF' : '#111827'}
                  fontSize="22"
                  fontWeight="800">
                  {insights.healthScore}
                </SvgText>
              </Svg>
              <View style={styles.gaugeInfo}>
                <Text style={[styles.gaugeTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  Financial Health Score
                </Text>
                <Text style={[styles.gaugeStatus, { color: getHealthColor(insights.healthScore) }]}>
                  {getHealthLabel(insights.healthScore)}
                </Text>
                <Text style={styles.gaugeSub}>Calculated from spending habits</Text>
              </View>
            </View>
          </GlassCard>

          {/* Forecast Box */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>Spending Forecast</Text>
            <GlassCard style={styles.forecastCard}>
              <View style={styles.forecastItem}>
                <Text style={styles.forecastLabel}>Predicted Month-End Expense</Text>
                <Text style={[styles.forecastValue, { color: Colors.expense || '#EF4444' }]}>
                  {currency}
                  {insights.predictedExpense.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }]} />
              <View style={styles.forecastItem}>
                <Text style={styles.forecastLabel}>Estimated Net Savings</Text>
                <Text style={[styles.forecastValue, { color: Colors.income || '#22C55E' }]}>
                  {currency}
                  {insights.predictedSavings.toLocaleString('en-IN')}
                </Text>
              </View>
            </GlassCard>
          </View>

          {/* Bulletins (Summaries) */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>AI Summaries</Text>
            <View style={styles.bulletinContainer}>
              <GlassCard style={styles.bulletinCard}>
                <View style={styles.bulletinHeader}>
                  <Icon name="calendar-outline" size={18} color="#8B5CF6" />
                  <Text style={[styles.bulletinTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>Weekly Summary</Text>
                </View>
                <Text style={[styles.bulletinText, { color: isDark ? '#A0A3BD' : '#64748B' }]}>
                  {insights.weeklySummary}
                </Text>
              </GlassCard>

              <GlassCard style={styles.bulletinCard}>
                <View style={styles.bulletinHeader}>
                  <Icon name="trending-up-outline" size={18} color="#8B5CF6" />
                  <Text style={[styles.bulletinTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>Monthly Overview</Text>
                </View>
                <Text style={[styles.bulletinText, { color: isDark ? '#A0A3BD' : '#64748B' }]}>
                  {insights.monthlySummary}
                </Text>
              </GlassCard>
            </View>
          </View>

          {/* Budget Warning Flags */}
          {insights.warnings && insights.warnings.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>Budget Warnings</Text>
              <View style={styles.warningsList}>
                {insights.warnings.map((warn) => (
                  <View
                    key={warn.id}
                    style={[
                      styles.warningItem,
                      {
                        backgroundColor: warn.type === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        borderColor: warn.type === 'danger' ? (Colors.expense || '#EF4444') : (Colors.warning || '#F59E0B'),
                      },
                    ]}>
                    <Icon
                      name={warn.type === 'danger' ? 'alert-circle-outline' : 'warning-outline'}
                      size={22}
                      color={warn.type === 'danger' ? (Colors.expense || '#EF4444') : (Colors.warning || '#F59E0B')}
                    />
                    <View style={styles.warningMeta}>
                      <Text
                        style={[
                          styles.warningTitle,
                          { color: warn.type === 'danger' ? (Colors.expense || '#EF4444') : (Colors.warning || '#F59E0B') },
                        ]}>
                        {warn.title}
                      </Text>
                      <Text style={[styles.warningMsg, { color: isDark ? '#E2E8F0' : '#334155' }]}>{warn.message}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Smart Savings Suggestions */}
          <View style={[styles.section, styles.lastSection]}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>AI Recommendations</Text>
            <View style={styles.suggestionsList}>
              {insights.suggestions.map((sug) => (
                <GlassCard key={sug.id} style={styles.suggestionCard}>
                  <View style={styles.suggestionHeader}>
                    <View style={styles.suggestionIconBg}>
                      <Icon name={sug.icon} size={20} color="#8B5CF6" />
                    </View>
                    <View style={styles.suggestionMeta}>
                      <Text style={[styles.suggestionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                        {sug.title}
                      </Text>
                      <Text style={styles.suggestionCat}>{sug.category}</Text>
                    </View>
                  </View>
                  <Text style={[styles.suggestionMsg, { color: isDark ? '#A0A3BD' : '#64748B' }]}>{sug.message}</Text>
                </GlassCard>
              ))}
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding || 20,
    paddingTop: Spacing.md || 12,
    marginBottom: Spacing.md || 12,
  },
  title: {
    ...Typography.h2,
    fontWeight: '800',
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.screenPadding || 20,
    paddingBottom: 40,
  },
  healthCard: {
    padding: 20,
    marginBottom: 20,
  },
  gaugeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  gaugeInfo: {
    flex: 1,
  },
  gaugeTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  gaugeStatus: {
    ...Typography.h3,
    fontWeight: '800',
    marginVertical: 2,
  },
  gaugeSub: {
    ...Typography.caption,
    color: '#6B6E8A',
    fontSize: 10,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...Typography.subtitle,
    fontWeight: '700',
    marginBottom: 12,
  },
  forecastCard: {
    flexDirection: 'row',
    padding: 16,
  },
  forecastItem: {
    flex: 1,
    alignItems: 'center',
  },
  forecastLabel: {
    ...Typography.caption,
    color: '#A0A3BD',
    textAlign: 'center',
  },
  forecastValue: {
    ...Typography.h3,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 6,
  },
  divider: {
    width: 1,
    height: '100%',
  },
  bulletinContainer: {
    gap: 12,
  },
  bulletinCard: {
    padding: 16,
  },
  bulletinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  bulletinTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  bulletinText: {
    ...Typography.bodySmall,
    lineHeight: 18,
  },
  warningsList: {
    gap: 10,
  },
  warningItem: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    alignItems: 'center',
  },
  warningMeta: {
    flex: 1,
  },
  warningTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  warningMsg: {
    ...Typography.caption,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  suggestionsList: {
    gap: 12,
  },
  suggestionCard: {
    padding: 16,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  suggestionIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionMeta: {
    justifyContent: 'center',
  },
  suggestionTitle: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  suggestionCat: {
    ...Typography.caption,
    color: '#6B6E8A',
    fontSize: 10,
    marginTop: 1,
  },
  suggestionMsg: {
    ...Typography.bodySmall,
    lineHeight: 18,
  },
  lastSection: {
    marginBottom: 0,
  },
});

export default AIInsightsScreen;
