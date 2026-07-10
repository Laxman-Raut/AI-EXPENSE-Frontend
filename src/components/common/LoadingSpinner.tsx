import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '../../theme';

interface Props {
  message?: string;
  size?: 'small' | 'large';
}

const LoadingSpinner: React.FC<Props> = ({ message, size = 'large' }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={Colors.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    gap: 16,
  },
  message: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
});

export default LoadingSpinner;
