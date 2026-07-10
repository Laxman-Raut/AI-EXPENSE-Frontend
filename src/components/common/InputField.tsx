import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing } from '../../theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: string;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
}

const InputField: React.FC<Props> = ({
  label,
  error,
  leftIcon,
  isPassword = false,
  containerStyle,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}>
        {leftIcon && (
          <Icon
            name={leftIcon}
            size={20}
            color={isFocused ? Colors.primary : Colors.textSecondary}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          {...rest}
          style={[styles.input, rest.style]}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={isPassword && !showPassword}
          onFocus={(e) => {
            setIsFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            rest.onBlur?.(e);
          }}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}>
            <Icon
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.base,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Spacing.borderRadiusSmall,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.base,
    minHeight: 52,
  },
  inputFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceLight,
  },
  inputError: {
    borderColor: Colors.error,
  },
  leftIcon: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.error,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});

export default InputField;
