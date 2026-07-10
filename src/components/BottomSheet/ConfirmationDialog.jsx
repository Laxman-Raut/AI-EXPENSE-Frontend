import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { Colors, Typography, Spacing } from '../../theme';
import PrimaryButton from '../Button/PrimaryButton';
import SecondaryButton from '../Button/SecondaryButton';
import useAppStore from '../../store/useAppStore';

const ConfirmationDialog = ({
  visible,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmTitle = 'Delete',
  cancelTitle = 'Cancel',
  isDanger = true,
  loading = false,
}) => {
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={[
          styles.dialog,
          {
            backgroundColor: isDark ? (Colors.surface || '#1C1F3B') : '#FFFFFF',
            borderColor: isDark ? (Colors.border || 'rgba(255, 255, 255, 0.08)') : '#E2E8F0',
          }
        ]}>
          <Text style={[styles.title, { color: isDark ? (Colors.textPrimary || '#FFFFFF') : '#111827' }]}>
            {title}
          </Text>
          <Text style={[styles.description, { color: isDark ? (Colors.textSecondary || '#A0A3BD') : '#64748B' }]}>
            {description}
          </Text>

          <View style={styles.buttonRow}>
            <SecondaryButton
              title={cancelTitle}
              onPress={onClose}
              style={styles.button}
              disabled={loading}
            />
            <PrimaryButton
              title={confirmTitle}
              onPress={onConfirm}
              loading={loading}
              variant="primary"
              style={[
                styles.button,
                isDanger && { shadowColor: Colors.expense || '#EF4444' }
              ]}
              textStyle={isDanger && { color: '#FFFFFF' }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl || 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 14, 33, 0.65)',
  },
  dialog: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 10,
  },
  title: {
    ...Typography.subtitle,
    fontWeight: '700',
    marginBottom: Spacing.sm || 8,
    textAlign: 'center',
  },
  description: {
    ...Typography.bodySmall,
    textAlign: 'center',
    marginBottom: Spacing.lg || 16,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.sm || 8,
  },
  button: {
    flex: 1,
    minHeight: 44,
  },
});

export default ConfirmationDialog;
