import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, spacing, typography, radius } from '../theme';

const PaymentOptionCard = ({
  title,
  subtitle,
  iconName,
  iconColor,
  bgColor,
  badgeText,
  onPress,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[styles.card, disabled && styles.cardDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={[styles.iconCircle, { backgroundColor: bgColor || colors.surface }]}>
        <Icon name={iconName} size={22} color={iconColor || colors.primary} />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {badgeText ? (
        <View
          style={[
            styles.badge,
            badgeText === 'Installed' ? styles.badgeInstalled : styles.badgeStore,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              badgeText === 'Installed' ? styles.badgeTextInstalled : styles.badgeTextStore,
            ]}
          >
            {badgeText}
          </Text>
        </View>
      ) : null}

      <Icon name="chevron-forward" size={18} color={colors.text.muted} style={styles.chevron} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.xl || 16,
    padding: spacing.md,
    marginBottom: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: {
    fontSize: typography.sizes?.md || 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.sizes?.xs || 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    marginRight: spacing.xs,
  },
  badgeInstalled: {
    backgroundColor: colors.success + '1A',
  },
  badgeStore: {
    backgroundColor: colors.info + '1A',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeTextInstalled: {
    color: colors.success,
  },
  badgeTextStore: {
    color: colors.info,
  },
  chevron: {
    marginLeft: spacing.xs,
  },
});

export default PaymentOptionCard;
