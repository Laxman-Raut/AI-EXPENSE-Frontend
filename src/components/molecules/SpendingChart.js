import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Card from './Card';
import { colors, spacing, typography, radius } from '../../theme';

const SpendingChart = ({ data = [], maxVal = 1, style }) => {
  return (
    <Card style={[styles.container, style]}>
      {/* Grid Lines */}
      <View style={styles.gridLinesContainer}>
        <View style={styles.gridLine} />
        <View style={styles.gridLine} />
        <View style={styles.gridLine} />
      </View>

      <View style={styles.barChartContainer}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxVal) * 110;
          const isHighlighted = item.isHighlighted;

          return (
            <View key={index} style={styles.barColumn}>
              {/* Value Indicator */}
              <Text style={[styles.valueText, isHighlighted && styles.valueHighlightedText]}>
                ${item.value}
              </Text>

              {/* Bar Track */}
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { height: Math.max(barHeight, 8) },
                    isHighlighted && styles.barFillHighlighted,
                  ]}
                />
              </View>

              {/* Label */}
              <Text style={[styles.monthLabel, isHighlighted && styles.monthHighlightedLabel]}>
                {item.month}
              </Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    position: 'relative',
    height: 200,
  },
  gridLinesContainer: {
    position: 'absolute',
    top: 52,
    left: spacing.md,
    right: spacing.md,
    height: 110,
    justifyContent: 'space-between',
    zIndex: 0,
  },
  gridLine: {
    height: 1,
    backgroundColor: colors.divider,
    width: '100%',
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
    zIndex: 1,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  valueText: {
    fontSize: 9,
    color: colors.text.muted,
    marginBottom: spacing.xs,
    fontWeight: typography.weights.medium,
  },
  valueHighlightedText: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  barTrack: {
    height: 110,
    justifyContent: 'flex-end',
    width: 14,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: 'rgba(75, 140, 255, 0.08)', // soft primary tint
    borderRadius: radius.full,
  },
  barFillHighlighted: {
    backgroundColor: colors.primary,
  },
  monthLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    marginTop: spacing.sm,
    fontWeight: typography.weights.medium,
  },
  monthHighlightedLabel: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
});

export default SpendingChart;
