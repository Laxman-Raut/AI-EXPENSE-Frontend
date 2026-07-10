import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import InputField from './InputField';
import { Colors, Spacing } from '../../theme';

const PasswordInput = React.forwardRef(({
  label = 'Password',
  error,
  leftIcon = 'lock-closed-outline',
  ...rest
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const eyeIcon = (
    <TouchableOpacity
      onPress={togglePasswordVisibility}
      style={styles.eyeIcon}
      activeOpacity={0.7}>
      <Icon
        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
        size={20}
        color={Colors.textSecondary || '#A0A3BD'}
      />
    </TouchableOpacity>
  );

  return (
    <InputField
      ref={ref}
      label={label}
      error={error}
      leftIcon={leftIcon}
      secureTextEntry={!showPassword}
      rightIcon={eyeIcon}
      {...rest}
    />
  );
});

PasswordInput.displayName = 'PasswordInput';

const styles = StyleSheet.create({
  eyeIcon: {
    padding: Spacing.xs || 4,
    marginLeft: Spacing.sm || 8,
  },
});

export default PasswordInput;
