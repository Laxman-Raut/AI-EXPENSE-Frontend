import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Icon from 'react-native-vector-icons/Ionicons';
import Card from './Card';
import { colors, spacing, typography, radius } from '../../theme';

const TransactionCard = ({
  title,
  category,
  paymentMethod,
  amount,
  type = 'expense',
  onDelete,
  onEdit,
  onPress,
}) => {
  const isIncome = type === 'income';
  const amountColor = isIncome ? colors.success : colors.danger;

  // Swipe Action Buttons (Edit and Delete)
  const renderRightActions = () => {
    return (
      <View style={styles.rightActionsContainer}>
        {onEdit && (
          <TouchableOpacity 
            style={[styles.actionBtn, styles.editBtn]} 
            onPress={onEdit}
            activeOpacity={0.8}
          >
            <Icon name="pencil" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity 
            style={[styles.actionBtn, styles.deleteBtn]} 
            onPress={onDelete}
            activeOpacity={0.8}
          >
            <Icon name="trash" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const getCategoryIcon = (cat) => {
    switch ((cat || '').toLowerCase()) {
      case 'food':
        return 'fast-food';
      case 'transport':
        return 'car';
      case 'shopping':
        return 'bag';
      case 'entertainment':
        return 'game-controller';
      case 'health':
        return 'heart';
      case 'bills':
        return 'receipt';
      case 'education':
        return 'school';
      case 'travel':
        return 'airplane';
      case 'salary':
        return 'cash';
      case 'freelance':
        return 'laptop';
      default:
        return 'ellipsis-horizontal';
    }
  };

  return (
    <View style={styles.swipeWrapper}>
      <Swipeable renderRightActions={renderRightActions} friction={2} rightThreshold={40}>
        <Card onPress={onPress} activeOpacity={0.8} style={styles.card}>
          <View style={[styles.iconWrapper, { backgroundColor: isIncome ? 'rgba(0, 210, 106, 0.08)' : 'rgba(255, 77, 103, 0.08)' }]}>
            <Icon name={getCategoryIcon(category)} size={22} color={amountColor} />
          </View>

          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.details} numberOfLines={1}>
              {category} • {paymentMethod}
            </Text>
          </View>

          <Text style={[styles.amount, { color: isIncome ? colors.success : colors.text.primary }]}>
            {isIncome ? '+' : '-'}
            {amount}
          </Text>
        </Card>
      </Swipeable>
    </View>
  );
};

const styles = StyleSheet.create({
  swipeWrapper: {
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
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
  rightActionsContainer: {
    flexDirection: 'row',
    width: 120,
    height: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  actionBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  editBtn: {
    backgroundColor: colors.primary,
  },
  deleteBtn: {
    backgroundColor: colors.danger,
  },
});

export default TransactionCard;
