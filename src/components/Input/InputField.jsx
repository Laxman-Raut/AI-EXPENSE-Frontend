import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing } from '../../theme';

const InputField = React.forwardRef(({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  style,
  onFocus,
  onBlur,
  onPress,
  ...rest
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  const WrapperComponent = onPress ? TouchableOpacity : View;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <WrapperComponent
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
        style={[
          styles.inputWrapper,
          isFocused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}>
        {leftIcon && (
          <Icon
            name={leftIcon}
            size={20}
            color={isFocused ? (Colors.primary || '#2563EB') : (Colors.textSecondary || '#A0A3BD')}
            style={styles.leftIcon}
          />
        )}
        {onPress ? (
          <Text
            style={[
              styles.input,
              style,
              !rest.value && { color: Colors.textMuted || '#6B6E8A' },
            ]}>
            {rest.value || rest.placeholder}
          </Text>
        ) : (
          <TextInput
            ref={ref}
            placeholderTextColor={Colors.textMuted || '#6B6E8A'}
            style={[styles.input, style]}
            onFocus={(e) => {
              setIsFocused(true);
              if (onFocus) onFocus(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              if (onBlur) onBlur(e);
            }}
            {...rest}
          />
        )}
        {rightIcon}
      </WrapperComponent>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
});

InputField.displayName = 'InputField';

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.base || 16,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary || '#A0A3BD',
    marginBottom: Spacing.sm || 8,
    marginLeft: Spacing.xs || 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface || '#1C1F3B',
    borderRadius: Spacing.borderRadiusSmall || 12,
    borderWidth: 1,
    borderColor: Colors.border || 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: Spacing.base || 16,
    minHeight: 52,
  },
  inputFocused: {
    borderColor: Colors.primary || '#2563EB',
    backgroundColor: Colors.surfaceLight || '#2A2D4E',
  },
  inputError: {
    borderColor: Colors.error || '#FF5252',
  },
  leftIcon: {
    marginRight: Spacing.md || 12,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary || '#FFFFFF',
    paddingVertical: 0,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.error || '#FF5252',
    marginTop: Spacing.xs || 4,
    marginLeft: Spacing.xs || 4,
  },
});

export default InputField;
