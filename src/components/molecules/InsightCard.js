import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Card from './Card';
import { colors, spacing, typography, radius } from '../../theme';

const InsightCard = ({ insightText, style }) => {
  return (
    <Card variant="glass" style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.iconWrapper}>
          <Icon name="sparkles" size={16} color={colors.primary} />
        </View>
        <Text style={styles.title}>AI Insight</Text>
      </View>
      <Text style={styles.text}>
        {insightText || "Reviewing your transactions... Click scanning receipt at calendar tab to track automatically."}
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(75, 140, 255, 0.15)', // glowing borders
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(75, 140, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  text: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    lineHeight: typography.lineHeights.base + 2,
    fontWeight: typography.weights.regular,
  },
});

export default InsightCard;
