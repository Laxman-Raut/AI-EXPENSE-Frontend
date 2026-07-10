import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing } from '../../theme';
import PrimaryButton from '../Button/PrimaryButton';

const EmptyState = ({
  icon = 'wallet-outline',
  title = 'No Data Found',
  description = 'There are no records to display at the moment.',
  actionTitle,
  onActionPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconBg}>
        <Icon name={icon} size={36} color={Colors.primary || '#2563EB'} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionTitle && onActionPress ? (
        <PrimaryButton
          title={actionTitle}
          onPress={onActionPress}
          style={styles.button}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl || 24,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    marginVertical: Spacing.lg || 16,
  },
  iconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md || 12,
  },
  title: {
    ...Typography.subtitle,
    color: Colors.textPrimary || '#FFFFFF',
    fontWeight: '700',
    marginBottom: Spacing.xs || 4,
    textAlign: 'center',
  },
  description: {
    ...Typography.bodySmall,
    color: Colors.textSecondary || '#A0A3BD',
    textAlign: 'center',
    marginBottom: Spacing.lg || 16,
    paddingHorizontal: 20,
  },
  button: {
    minWidth: 150,
  },
});

export default EmptyState;
