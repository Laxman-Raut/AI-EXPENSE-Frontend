import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, Animated } from 'react-native';
import { Colors, Typography, Spacing } from '../../theme';

const Snackbar = ({
  visible,
  message,
  actionText,
  onActionPress,
  duration = 4000,
  onDismiss,
  type = 'info', // 'info' | 'success' | 'error' | 'warning'
}) => {
  const slideAnim = React.useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: 100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      if (onDismiss) onDismiss();
    });
  };

  if (!visible) return null;

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return Colors.incomeBg || 'rgba(34, 197, 94, 0.15)';
      case 'error':
        return Colors.expenseBg || 'rgba(239, 68, 68, 0.15)';
      case 'warning':
        return 'rgba(245, 158, 11, 0.15)';
      default:
        return Colors.surfaceLight || '#2A2D4E';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return Colors.income || '#22C55E';
      case 'error':
        return Colors.expense || '#EF4444';
      case 'warning':
        return Colors.warning || '#F59E0B';
      default:
        return Colors.primary || '#2563EB';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          backgroundColor: getBgColor(),
          borderColor: getBorderColor(),
        },
      ]}>
      <Text style={styles.text}>{message}</Text>
      {actionText && onActionPress ? (
        <TouchableOpacity onPress={onActionPress} style={styles.actionBtn}>
          <Text style={[styles.actionText, { color: getBorderColor() }]}>
            {actionText}
          </Text>
        </TouchableOpacity>
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 99999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  text: {
    ...Typography.bodySmall,
    color: '#FFFFFF',
    flex: 1,
    fontWeight: '500',
  },
  actionBtn: {
    marginLeft: Spacing.sm || 8,
  },
  actionText: {
    ...Typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

export default Snackbar;
