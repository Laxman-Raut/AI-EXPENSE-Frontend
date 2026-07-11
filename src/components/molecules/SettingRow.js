import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, spacing, typography, radius } from '../../theme';

const SettingRow = ({
  icon,
  label,
  value,
  onPress,
  rightElement,
  isLast = false,
}) => {
  const content = (
    <View style={[styles.container, !isLast && styles.borderBottom]}>
      <View style={styles.left}>
        <View style={styles.iconBox}>
          <Icon name={icon} size={20} color={colors.text.secondary} />
        </View>
        <Text style={styles.label}>{label}</Text>
      </View>

      <View style={styles.right}>
        {value ? <Text style={styles.value}>{value}</Text> : null}
        {rightElement ? (
          rightElement
        ) : onPress ? (
          <Icon name="chevron-forward" size={16} color={colors.text.muted} style={styles.chevron} />
        ) : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  label: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    fontWeight: typography.weights.semibold,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  value: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  chevron: {
    marginLeft: spacing.xs,
  },
});

export default SettingRow;
