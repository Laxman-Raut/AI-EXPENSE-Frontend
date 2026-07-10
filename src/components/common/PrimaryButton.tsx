import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Typography, Spacing } from '../../theme';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

const PrimaryButton: React.FC<Props> = ({
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
        style={[style]}>
        <LinearGradient
          colors={isDisabled ? [Colors.surfaceLight, Colors.surfaceLight] : [Colors.primary, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.button, styles.primaryButton]}>
          {loading ? (
            <ActivityIndicator color={Colors.textPrimary} size="small" />
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
          color={variant === 'outline' ? Colors.primary : Colors.textSecondary}
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
    paddingHorizontal: Spacing.xl,
    borderRadius: Spacing.borderRadius,
    minHeight: 52,
    gap: Spacing.sm,
  },
  primaryButton: {
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
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
    color: Colors.textPrimary,
  },
  outlineText: {
    color: Colors.primary,
  },
  ghostText: {
    color: Colors.textSecondary,
  },
});

export default PrimaryButton;
