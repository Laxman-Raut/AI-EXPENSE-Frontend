import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, shadow } from '../../theme';

const Card = ({
  children,
  onPress,
  style,
  variant = 'solid', // 'solid' | 'outlined' | 'glass'
  activeOpacity = 0.9,
  ...props
}) => {
  const getCardStyle = () => {
    switch (variant) {
      case 'outlined':
        return [styles.card, styles.outlinedCard];
      case 'glass':
        return [styles.card, styles.glassCard];
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
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  outlinedCard: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  glassCard: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
});

export default Card;
