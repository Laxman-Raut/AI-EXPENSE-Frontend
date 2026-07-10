import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing } from '../../theme';

const IconButton = ({
  name,
  size = 22,
  color,
  onPress,
  disabled = false,
  variant = 'default', // 'default' | 'glass' | 'border' | 'primary'
  style,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'glass':
        return {
          backgroundColor: Colors.glass || 'rgba(255, 255, 255, 0.05)',
          borderColor: Colors.border || 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
        };
      case 'border':
        return {
          backgroundColor: 'transparent',
          borderColor: Colors.border || 'rgba(255, 255, 255, 0.08)',
          borderWidth: 1,
        };
      case 'primary':
        return {
          backgroundColor: Colors.primary || '#2563EB',
        };
      default:
        return {
          backgroundColor: 'transparent',
        };
    }
  };

  const getIconColor = () => {
    if (color) return color;
    if (variant === 'primary') return Colors.textPrimary || '#FFFFFF';
    return Colors.textPrimary || '#FFFFFF';
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.button,
        getVariantStyles(),
        disabled && styles.disabled,
        style,
      ]}>
      <Icon name={name} size={size} color={getIconColor()} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default IconButton;
