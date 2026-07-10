import React, { useEffect } from 'react';
import { StyleSheet, Text, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography } from '../../theme';

const Toast = ({
  visible,
  message,
  type = 'info', // 'success' | 'error' | 'warning' | 'info'
  duration = 3000,
  onDismiss,
}) => {
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      if (onDismiss) onDismiss();
    });
  };

  if (!visible) return null;

  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return { name: 'checkmark-circle', color: Colors.income || '#22C55E' };
      case 'error':
        return { name: 'alert-circle', color: Colors.expense || '#EF4444' };
      case 'warning':
        return { name: 'warning', color: Colors.warning || '#F59E0B' };
      default:
        return { name: 'information-circle', color: Colors.primary || '#2563EB' };
    }
  };

  const iconConfig = getIconConfig();

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          opacity,
          backgroundColor: Colors.surface || '#1C1F3B',
          borderColor: Colors.border || 'rgba(255, 255, 255, 0.08)',
        },
      ]}>
      <Icon name={iconConfig.name} size={22} color={iconConfig.color} />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    borderRadius: 30,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 999999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    gap: 10,
  },
  text: {
    ...Typography.bodySmall,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
  },
});

export default Toast;
