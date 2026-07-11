import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import PrimaryButton from '../atoms/PrimaryButton';
import Card from './Card';
import { colors, spacing, typography } from '../../theme';

const CustomAlert = ({
  visible,
  title,
  message,
  type = 'info', // 'info' | 'warning' | 'destructive'
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  const isDestructive = type === 'destructive';
  const isWarning = type === 'warning';
  
  let confirmBtnType = 'primary';
  if (isDestructive) {
    confirmBtnType = 'danger';
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Card style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.actions}>
            {onCancel && (
              <PrimaryButton
                title={cancelText}
                onPress={onCancel}
                type="ghost"
                style={styles.btn}
              />
            )}
            <PrimaryButton
              title={confirmText}
              onPress={onConfirm}
              type={confirmBtnType}
              style={styles.btn}
            />
          </View>
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    padding: spacing.xl,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    lineHeight: typography.lineHeights.base,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  btn: {
    flex: 1,
  },
});

export default CustomAlert;
