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
  buttons = [],
  onButtonPress,
  onCancel,
}) => {
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
          {message ? <Text style={styles.message}>{message}</Text> : null}
          
          <View style={styles.actions}>
            {buttons.map((btn, index) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              
              let btnType = 'primary';
              if (isCancel) {
                btnType = 'ghost';
              } else if (isDestructive) {
                btnType = 'danger';
              }
              
              return (
                <PrimaryButton
                  key={index}
                  title={btn.text}
                  onPress={() => onButtonPress(btn)}
                  type={btnType}
                  style={styles.btn}
                />
              );
            })}
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
