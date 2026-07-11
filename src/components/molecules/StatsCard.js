import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Card from './Card';
import { colors, spacing, typography } from '../../theme';

const StatsCard = ({ title, amount, type = 'income', style }) => {
  const isIncome = type === 'income';
  const iconColor = isIncome ? colors.success : colors.danger;
  const iconName = isIncome ? 'arrow-up-circle' : 'arrow-down-circle';

  return (
    <Card style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={[styles.iconWrapper, { backgroundColor: iconColor + '15' }]}>
          <Icon name={iconName} size={22} color={iconColor} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={[styles.amount, { color: isIncome ? colors.success : colors.text.primary }]}>
        {amount}
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  amount: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    lineHeight: typography.lineHeights.xl,
  },
});

export default StatsCard;
