import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, spacing, typography, radius } from '../theme';

const Snackbar = ({
  visible,
  message,
  type = 'error', // 'error' | 'success' | 'warning' | 'info'
  actionText,
  onAction,
  onDismiss,
  duration = 4000,
}) => {
  const translateY = React.useRef(new Animated.Value(100)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      if (!actionText && duration > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      handleDismiss();
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss && visible) {
        onDismiss();
      }
    });
  };

  if (!visible) return null;

  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle-outline';
      case 'warning':
        return 'warning-outline';
      case 'info':
        return 'information-circle-outline';
      case 'error':
      default:
        return 'alert-circle-outline';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'info':
        return colors.info;
      case 'error':
      default:
        return colors.danger;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.content}>
        <Icon name={getIconName()} size={22} color={getIconColor()} style={styles.icon} />
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>

        {actionText ? (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              if (onAction) onAction();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.actionText}>{actionText}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.closeBtn} onPress={handleDismiss}>
            <Icon name="close" size={18} color={colors.text.muted} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E202C',
    borderRadius: radius.lg || 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  icon: {
    marginRight: spacing.sm,
  },
  message: {
    flex: 1,
    fontSize: typography.sizes?.sm || 13,
    color: colors.text.primary,
    fontWeight: '500',
  },
  actionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.md,
    marginLeft: spacing.sm,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
});

export default Snackbar;
