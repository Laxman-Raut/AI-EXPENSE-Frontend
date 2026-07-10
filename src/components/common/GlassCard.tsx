import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Colors, Spacing } from '../../theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'income' | 'expense';
}

const GlassCard: React.FC<Props> = ({ children, style, variant = 'default' }) => {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return { backgroundColor: Colors.surfaceLight };
      case 'income':
        return {
          backgroundColor: Colors.incomeBg,
          borderColor: 'rgba(0, 230, 118, 0.2)',
        };
      case 'expense':
        return {
          backgroundColor: Colors.expenseBg,
          borderColor: 'rgba(255, 82, 82, 0.2)',
        };
      default:
        return { backgroundColor: Colors.glass };
    }
  };

  return (
    <View style={[styles.card, getVariantStyle(), style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.borderRadius,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.cardPadding,
    overflow: 'hidden',
  },
});

export default GlassCard;
