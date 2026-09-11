import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, spacing, typography } from '../../theme';

const Header = ({
  title,
  subtitle,
  leftIcon,
  onLeftPress,
  rightIcon,
  onRightPress,
  rightActions,
  showBack,
  safeArea = false,
  bordered = false,
  style,
  titleStyle,
}) => {
  const insets = useSafeAreaInsets();
  const topPadding = (safeArea ? insets.top : 0) + (Platform.OS === 'ios' ? spacing.sm + 4 : spacing.md);

  const renderedLeftIcon = leftIcon || ((showBack || onLeftPress) ? (
    <Icon name="chevron-back" size={24} color={colors.text.primary} />
  ) : null);

  return (
    <View 
      style={[
        styles.container, 
        { paddingTop: topPadding },
        bordered && styles.bordered,
        style
      ]}
    >
      {/* Left Slot */}
      <View style={styles.leftSlot}>
        {renderedLeftIcon ? (
          <TouchableOpacity 
            onPress={onLeftPress} 
            activeOpacity={0.7} 
            style={styles.actionBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            disabled={!onLeftPress}
          >
            {renderedLeftIcon}
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Center Slot (Title & Subtitle) */}
      <View style={styles.centerSlot}>
        {title ? (
          <Text numberOfLines={1} style={[styles.title, titleStyle]}>
            {title}
          </Text>
        ) : null}
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
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: 'transparent',
  },
  bordered: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border || colors.divider,
  },
  leftSlot: {
    minWidth: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  rightSlot: {
    minWidth: 44,
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
    borderColor: colors.border || colors.divider,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
    marginTop: 2,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});

export default Header;
