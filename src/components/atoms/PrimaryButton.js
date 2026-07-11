import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors, spacing, typography, radius } from '../../theme';

const PrimaryButton = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  type = 'primary', // 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost'
  icon,
  style,
  textStyle,
}) => {
  const getButtonStyles = () => {
    switch (type) {
      case 'secondary':
        return [styles.button, styles.secondaryButton, disabled && styles.disabledSecondaryButton];
      case 'danger':
        return [styles.button, styles.dangerButton, disabled && styles.disabledDangerButton];
      case 'outline':
        return [styles.button, styles.outlineButton, disabled && styles.disabledOutlineButton];
      case 'ghost':
        return [styles.button, styles.ghostButton, disabled && styles.disabledGhostButton];
      case 'primary':
      default:
        return [styles.button, styles.primaryButton, disabled && styles.disabledPrimaryButton];
    }
  };

  const getTextStyles = () => {
    switch (type) {
      case 'outline':
        return [styles.text, styles.outlineText, disabled && styles.disabledOutlineText];
      case 'ghost':
        return [styles.text, styles.ghostText, disabled && styles.disabledGhostText];
      case 'primary':
      case 'secondary':
      case 'danger':
      default:
        return [styles.text, styles.solidText, disabled && styles.disabledSolidText];
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[getButtonStyles(), style]}
    >
      {loading ? (
        <ActivityIndicator 
          color={type === 'outline' || type === 'ghost' ? colors.primary : colors.text.inverse} 
          size="small" 
        />
      ) : (
        <View style={styles.contentContainer}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[getTextStyles(), textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  // Type styles
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
  dangerButton: {
    backgroundColor: colors.danger,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  // Disabled states
  disabledPrimaryButton: {
    backgroundColor: colors.secondary,
    opacity: 0.5,
  },
  disabledSecondaryButton: {
    backgroundColor: colors.secondary,
    opacity: 0.3,
  },
  disabledDangerButton: {
    backgroundColor: colors.danger,
    opacity: 0.5,
  },
  disabledOutlineButton: {
    borderColor: colors.border,
  },
  disabledGhostButton: {
    opacity: 0.5,
  },
  // Text styles
  text: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.md,
    textAlign: 'center',
  },
  solidText: {
    color: colors.text.primary,
  },
  outlineText: {
    color: colors.primary,
  },
  ghostText: {
    color: colors.text.secondary,
  },
  // Disabled text
  disabledSolidText: {
    color: colors.text.muted,
  },
  disabledOutlineText: {
    color: colors.text.muted,
  },
  disabledGhostText: {
    color: colors.text.muted,
  },
});

export default PrimaryButton;
