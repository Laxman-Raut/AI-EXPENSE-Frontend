import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Typography, Spacing } from '../../theme';

const PrimaryButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
  icon,
}) => {
  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={style}>
        <LinearGradient
          colors={isDisabled ? [Colors.surfaceLight || '#2A2D4E', Colors.surfaceLight || '#2A2D4E'] : [Colors.primary || '#2563EB', Colors.primaryDark || '#1D4ED8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.button, styles.primaryButton]}>
          {loading ? (
            <ActivityIndicator color={Colors.textPrimary || '#FFFFFF'} size="small" />
          ) : (
            <>
              {icon}
              <Text style={[styles.buttonText, styles.primaryText, textStyle]}>
                {title}
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.button,
        variant === 'outline' ? styles.outlineButton : styles.ghostButton,
        isDisabled && styles.disabledButton,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' ? (Colors.primary || '#2563EB') : (Colors.textSecondary || '#A0A3BD')}
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.buttonText,
              variant === 'outline' ? styles.outlineText : styles.ghostText,
              textStyle,
            ]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl || 24,
    borderRadius: Spacing.borderRadius || 16,
    minHeight: 52,
    gap: Spacing.sm || 8,
  },
  primaryButton: {
    elevation: 4,
    shadowColor: Colors.primary || '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: Colors.primary || '#2563EB',
    backgroundColor: 'transparent',
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    ...Typography.button,
  },
  primaryText: {
    color: Colors.textPrimary || '#FFFFFF',
  },
  outlineText: {
    color: Colors.primary || '#2563EB',
  },
  ghostText: {
    color: Colors.textSecondary || '#A0A3BD',
  },
});

export default PrimaryButton;
