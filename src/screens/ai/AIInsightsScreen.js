import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import Screen from '../../components/templates/Screen';
import Card from '../../components/molecules/Card';
import Header from '../../components/molecules/Header';
import { colors, spacing, typography, radius, shadow } from '../../theme';
import { fetchAIInsights } from '../../api/ai';
import { formatCurrency } from '../../utils/formatCurrency';

const AIInsightsScreen = () => {
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

  // Circular Gauge calculations
  const gaugeRadius = 50;
  const stroke = 10;
  const normalizedRadius = gaugeRadius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;

  const getHealthLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Action Needed';
  };

  const getHealthColor = (score) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.danger;
  };

  const renderHeader = () => (
    <Header
      title="AI Insights"
      rightIcon={<Icon name="sparkles" size={20} color={colors.primary} />}
    />
  );

  if (loading || !insights) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const strokeDashoffset = circumference - (insights.healthScore / 100) * circumference;

  return (
    <View style={styles.root}>
      <Screen 
        scrollable 
        header={renderHeader()}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        style={styles.contentContainer}
      >
        {/* Radial Health Gauge Card */}
        <View style={styles.section}>
          <Card style={[styles.healthCard, shadow.md]}>
            <View style={styles.gaugeContainer}>
              <Svg height={gaugeRadius * 2} width={gaugeRadius * 2}>
                <Circle
                  stroke="rgba(255, 255, 255, 0.05)"
                  fill="transparent"
                  strokeWidth={stroke}
                  r={normalizedRadius}
                  cx={gaugeRadius}
                  cy={gaugeRadius}
                />
                <Circle
                  stroke={getHealthColor(insights.healthScore)}
                  fill="transparent"
                  strokeWidth={stroke}
                  strokeDasharray={circumference + ' ' + circumference}
                  style={{ strokeDashoffset }}
                  strokeLinecap="round"
                  r={normalizedRadius}
                  cx={gaugeRadius}
                  cy={gaugeRadius}
                  transform={`rotate(-90 ${gaugeRadius} ${gaugeRadius})`}
                />
                <SvgText
                  x="50%"
                  y="57%"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="22"
                  fontWeight="800"
                >
                  {insights.healthScore}
                </SvgText>
              </Svg>

              <View style={styles.gaugeInfo}>
                <Text style={styles.gaugeTitle}>Financial Health Score</Text>
                <Text style={[styles.gaugeStatus, { color: getHealthColor(insights.healthScore) }]}>
                  {getHealthLabel(insights.healthScore)}
                </Text>
                <Text style={styles.gaugeSub}>Based on your spending rate</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Forecast Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending Forecast</Text>
          <Card style={styles.forecastCard}>
            <View style={styles.forecastItem}>
              <Text style={styles.forecastLabel}>Predicted Month-End</Text>
              <Text style={[styles.forecastValue, { color: colors.danger }]}>
                {formatCurrency(insights.predictedExpense || 0)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.forecastItem}>
              <Text style={styles.forecastLabel}>Estimated Net Savings</Text>
              <Text style={[styles.forecastValue, { color: colors.success }]}>
                {formatCurrency(insights.predictedSavings || 0)}
              </Text>
            </View>
          </Card>
        </View>

        {/* AI Bulletins summaries */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Bulletins</Text>
          <View style={styles.bulletinContainer}>
            <Card style={styles.bulletinCard}>
              <View style={styles.bulletinHeader}>
                <Icon name="calendar-outline" size={18} color={colors.primary} />
                <Text style={styles.bulletinTitle}>Weekly Summary</Text>
              </View>
              <Text style={styles.bulletinText}>
                {insights.weeklySummary}
              </Text>
            </Card>

            <Card style={styles.bulletinCard}>
              <View style={styles.bulletinHeader}>
                <Icon name="trending-up-outline" size={18} color={colors.primary} />
                <Text style={styles.bulletinTitle}>Monthly Overview</Text>
              </View>
              <Text style={styles.bulletinText}>
                {insights.monthlySummary}
              </Text>
            </Card>
          </View>
        </View>

        {/* Warnings flag lists */}
        {insights.warnings && insights.warnings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Flags & Warnings</Text>
            <View style={styles.warningsList}>
              {insights.warnings.map((warn) => {
                const isDanger = warn.type === 'danger';
                return (
                  <View
                    key={warn.id}
                    style={[
                      styles.warningItem,
                      {
                        backgroundColor: isDanger ? 'rgba(255, 77, 103, 0.08)' : 'rgba(255, 182, 72, 0.08)',
                        borderColor: isDanger ? colors.danger : colors.warning,
                      },
                    ]}
                  >
                    <Icon
                      name={isDanger ? 'alert-circle-outline' : 'warning-outline'}
                      size={20}
                      color={isDanger ? colors.danger : colors.warning}
                    />
                    <View style={styles.warningMeta}>
                      <Text style={[styles.warningTitle, { color: isDanger ? colors.danger : colors.warning }]}>
                        {warn.title}
                      </Text>
                      <Text style={styles.warningMsg}>{warn.message}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Recommendations suggestions cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          <View style={styles.suggestionsList}>
            {insights.suggestions.map((sug) => (
              <Card key={sug.id} style={styles.suggestionCard}>
                <View style={styles.suggestionHeader}>
                  <View style={styles.suggestionIconBg}>
                    <Icon name={sug.icon || 'star-outline'} size={18} color={colors.primary} />
                  </View>
                  <View style={styles.suggestionMeta}>
                    <Text style={styles.suggestionTitle}>{sug.title}</Text>
                    <Text style={styles.suggestionCat}>{sug.category}</Text>
                  </View>
                </View>
                <Text style={styles.suggestionMsg}>{sug.message}</Text>
              </Card>
            ))}
          </View>
        </View>

        {/* Scroll footer padding */}
        <View style={{ height: 100 }} />
      </Screen>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingRoot: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  healthCard: {
    padding: spacing.lg,
  },
  gaugeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  gaugeInfo: {
    flex: 1,
  },
  gaugeTitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontWeight: typography.weights.semibold,
  },
  gaugeStatus: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginVertical: 2,
  },
  gaugeSub: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    fontWeight: typography.weights.medium,
  },
  forecastCard: {
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  forecastItem: {
    flex: 1,
    alignItems: 'center',
  },
  forecastLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.weights.semibold,
    marginBottom: 4,
  },
  forecastValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: colors.divider,
  },
  bulletinContainer: {
    gap: spacing.sm,
  },
  bulletinCard: {
    padding: spacing.md,
  },
  bulletinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  bulletinTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  bulletinText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: typography.lineHeights.base,
  },
  warningsList: {
    gap: spacing.sm,
  },
  warningItem: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    gap: spacing.sm,
    alignItems: 'center',
  },
  warningMeta: {
    flex: 1,
  },
  warningTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    marginBottom: 2,
  },
  warningMsg: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: typography.lineHeights.base,
  },
  suggestionsList: {
    gap: spacing.sm,
  },
  suggestionCard: {
    padding: spacing.md,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  suggestionIconBg: {
    width: 32,
    height: 32,
    borderRadius: radius.xs,
    backgroundColor: 'rgba(75, 140, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionMeta: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  suggestionCat: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    fontWeight: typography.weights.semibold,
  },
  suggestionMsg: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: typography.lineHeights.base,
  },
});

export default AIInsightsScreen;
