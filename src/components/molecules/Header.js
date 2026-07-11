import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../../theme';

const Header = ({
  title,
  subtitle,
  leftIcon,
  onLeftPress,
  rightIcon,
  onRightPress,
  rightActions,
  style,
  titleStyle,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Left Slot */}
      <View style={styles.leftSlot}>
        {leftIcon ? (
          <TouchableOpacity 
            onPress={onLeftPress} 
            activeOpacity={0.7} 
            style={styles.actionBtn}
            disabled={!onLeftPress}
          >
            {leftIcon}
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Center Slot (Title & Subtitle) */}
      <View style={styles.centerSlot}>
        <Text numberOfLines={1} style={[styles.title, titleStyle]}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Right Slot */}
      <View style={styles.rightSlot}>
        {rightActions ? (
          rightActions
        ) : rightIcon ? (
          <TouchableOpacity 
            onPress={onRightPress} 
            activeOpacity={0.7} 
            style={styles.actionBtn}
            disabled={!onRightPress}
          >
            {rightIcon}
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    backgroundColor: 'transparent',
  },
  leftSlot: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSlot: {
    width: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
    marginTop: 2,
    textAlign: 'center',
  },
});

export default Header;
