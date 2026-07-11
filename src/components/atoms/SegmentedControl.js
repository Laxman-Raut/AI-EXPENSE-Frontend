import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../../theme';

const SegmentedControl = ({ options = [], activeIndex = 0, onChange, style }) => {
  return (
    <View style={[styles.container, style]}>
      {options.map((option, idx) => {
        const isActive = activeIndex === idx;
        
        // Dynamically style based on active state name (Income/Expense theme coloring)
        const isExpenseOption = option.toLowerCase().includes('expense');
        const activeBg = isExpenseOption ? 'rgba(255, 77, 103, 0.1)' : 'rgba(0, 210, 106, 0.1)';
        const activeTxtColor = isExpenseOption ? colors.danger : colors.success;

        return (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.8}
            onPress={() => onChange(idx)}
            style={[
              styles.segment,
              isActive && { backgroundColor: activeBg }
            ]}
          >
            <Text 
              style={[
                styles.text, 
                isActive ? { color: activeTxtColor, fontWeight: typography.weights.bold } : null
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.divider,
    width: '100%',
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  text: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
  },
});

export default SegmentedControl;
