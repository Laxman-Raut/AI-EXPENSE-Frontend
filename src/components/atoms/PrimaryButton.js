import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
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
        return [styles.button, styles.primaryButtonContainer, disabled && styles.disabledPrimaryButton];
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

  // Primary type uses a LinearGradient wrapper for depth
  if (type === 'primary') {
    return (
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={onPress}
        disabled={disabled || loading}
        style={[styles.primaryShadowWrapper, style]}
      >
        <LinearGradient
          colors={
            disabled
              ? [colors.secondary, colors.secondary]
              : [colors.primaryLight, colors.primaryDark]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.button, styles.gradientButton, disabled && styles.disabledPrimaryButton]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={styles.contentContainer}>
              {icon && <View style={styles.iconContainer}>{icon}</View>}
              <Text style={[getTextStyles(), textStyle]}>{title}</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

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
  primaryShadowWrapper: {
    borderRadius: radius.xl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  button: {
    height: 54,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
  },
  gradientButton: {
    // radius inherited via primaryShadowWrapper clip
    overflow: 'hidden',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  // Non-primary type styles
  primaryButtonContainer: {
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
    opacity: 0.45,
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
    fontWeight: typography.weights.bold,
    lineHeight: typography.lineHeights.md,
    textAlign: 'center',
  },
  solidText: {
    color: '#FFFFFF',
  },
  outlineText: {
    color: colors.primary,
  },
  ghostText: {
    color: colors.text.secondary,
  },
  // Disabled text
  disabledSolidText: {
    color: 'rgba(255,255,255,0.5)',
  },
  disabledOutlineText: {
    color: colors.text.muted,
  },
  disabledGhostText: {
    color: colors.text.muted,
  },
});

export default PrimaryButton;
