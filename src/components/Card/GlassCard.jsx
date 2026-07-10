import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors, Spacing } from '../../theme';
import useAppStore from '../../store/useAppStore';

const GlassCard = ({ children, style, variant = 'default' }) => {
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';

  const getVariantStyle = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: Colors.surface,
          borderColor: Colors.border,
          shadowColor: isDark ? '#000000' : '#4F46E5',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.3 : 0.06,
          shadowRadius: 12,
          elevation: 4,
        };
      case 'income':
        return {
          backgroundColor: Colors.incomeBg,
          borderColor: Colors.income + '25',
        };
      case 'expense':
        return {
          backgroundColor: Colors.expenseBg,
          borderColor: Colors.expense + '25',
        };
      default:
        return {
          backgroundColor: Colors.glass,
          borderColor: Colors.border,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.15 : 0.03,
          shadowRadius: 6,
          elevation: 1,
        };
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
    borderRadius: Spacing.borderRadius || 16,
    borderWidth: 1,
    padding: Spacing.cardPadding || 16,
    overflow: 'hidden',
  },
});

export default GlassCard;
