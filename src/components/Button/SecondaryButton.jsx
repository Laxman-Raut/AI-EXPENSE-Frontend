import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Colors, Typography, Spacing } from '../../theme';

const SecondaryButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.button,
        isDisabled && styles.disabledButton,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={Colors.textSecondary || '#A0A3BD'} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.buttonText, textStyle]}>
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
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg || 16,
    borderRadius: Spacing.borderRadiusSmall || 12,
    backgroundColor: Colors.surfaceLight || '#2A2D4E',
    borderWidth: 1,
    borderColor: Colors.border || 'rgba(255, 255, 255, 0.08)',
    minHeight: 48,
    gap: Spacing.sm || 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.textPrimary || '#FFFFFF',
  },
});

export default SecondaryButton;
