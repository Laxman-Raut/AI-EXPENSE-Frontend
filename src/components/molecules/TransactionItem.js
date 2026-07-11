import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Card from './Card';
import { colors, spacing, typography, radius } from '../../theme';

const TransactionItem = ({
  title,
  paymentMethod,
  date,
  amount,
  type = 'expense',
  onPress,
  style,
}) => {
  const isIncome = type === 'income';
  const amountColor = isIncome ? colors.success : colors.danger;
  const initial = title ? title.trim().charAt(0).toUpperCase() : 'T';

  return (
    <Card onPress={onPress} activeOpacity={0.7} style={[styles.container, style]}>
      <View style={[styles.avatar, { backgroundColor: isIncome ? 'rgba(0, 210, 106, 0.08)' : 'rgba(255, 77, 103, 0.08)' }]}>
        <Text style={[styles.avatarText, { color: amountColor }]}>{initial}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.details} numberOfLines={1}>
          {paymentMethod} • {date}
        </Text>
      </View>

      <Text style={[styles.amount, { color: isIncome ? colors.success : colors.text.primary }]}>
        {isIncome ? '+' : '-'}
        {amount}
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  details: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  amount: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
});

export default TransactionItem;
