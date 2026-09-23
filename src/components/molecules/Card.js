import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, shadow } from '../../theme';

const Card = ({
  children,
  onPress,
  style,
  variant = 'solid', // 'solid' | 'outlined' | 'glass' | 'elevated'
  activeOpacity = 0.9,
  ...props
}) => {
  const getCardStyle = () => {
    switch (variant) {
      case 'outlined':
        return [styles.card, styles.outlinedCard];
      case 'glass':
        return [styles.card, styles.glassCard];
      case 'elevated':
        return [styles.card, styles.elevatedCard];
      case 'solid':
      default:
        return [styles.card, styles.solidCard, shadow.sm];
    }
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={activeOpacity}
        onPress={onPress}
        style={[getCardStyle(), style]}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[getCardStyle(), style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  solidCard: {
    backgroundColor: colors.cardElevated || '#14151E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  outlinedCard: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  elevatedCard: {
    backgroundColor: colors.cardElevated || '#14151E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
});

export default Card;
