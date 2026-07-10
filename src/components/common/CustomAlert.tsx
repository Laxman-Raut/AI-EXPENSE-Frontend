import React from 'react';
import { Modal, StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../theme';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'destructive' | 'warning' | 'info' | 'success';
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  type = 'info',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [scaleAnim] = React.useState(new Animated.Value(0.9));

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const getAlertIcon = () => {
    switch (type) {
      case 'destructive':
        return { name: 'trash-outline', color: '#F43F5E', bg: 'rgba(244, 63, 94, 0.1)' };
      case 'warning':
        return { name: 'warning-outline', color: '#FF9500', bg: 'rgba(255, 149, 0, 0.1)' };
      case 'success':
        return { name: 'checkmark-circle-outline', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' };
      default:
        return { name: 'information-circle-outline', color: '#8A3FFC', bg: 'rgba(138, 63, 252, 0.1)' };
    }
  };

  const iconConfig = getAlertIcon();

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onCancel}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.alertContainer, { transform: [{ scale: scaleAnim }] }]}>
          {/* Circular Themed Icon Header */}
          <View style={[styles.iconContainer, { backgroundColor: iconConfig.bg }]}>
            <Icon name={iconConfig.name} size={36} color={iconConfig.color} />
          </View>

          {/* Title & Message */}
          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.messageText}>{message}</Text>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              activeOpacity={0.7}
              onPress={onCancel}>
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                type === 'destructive' ? styles.confirmDestructive : null,
              ]}
              activeOpacity={0.7}
              onPress={onConfirm}>
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)', // Slate-900 transparent overlay
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  alertContainer: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A', // Premium slate-900 title
    textAlign: 'center',
    marginBottom: 10,
  },
  messageText: {
    fontSize: 13,
    color: '#64748B', // Slate-500 message
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F3F9',
  },
  cancelButtonText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 13,
  },
  confirmButton: {
    backgroundColor: '#FF6037', // Default mockup orange accent
  },
  confirmDestructive: {
    backgroundColor: '#F43F5E', // Red color for delete
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});

export default CustomAlert;
