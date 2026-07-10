import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../theme';

const Loader = ({
  message = 'Loading...',
  fullScreen = true,
}) => {
  if (!fullScreen) {
    return (
      <View style={styles.inlineContainer}>
        <ActivityIndicator color={Colors.primary || '#2563EB'} size="large" />
        {message ? <Text style={styles.inlineText}>{message}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.fullScreenOverlay}>
      <View style={styles.glassContainer}>
        <ActivityIndicator color={Colors.primary || '#2563EB'} size="large" />
        {message ? <Text style={styles.glassText}>{message}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inlineContainer: {
    padding: Spacing.xl || 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm || 8,
  },
  inlineText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary || '#A0A3BD',
  },
  fullScreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 14, 33, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  glassContainer: {
    backgroundColor: 'rgba(28, 31, 59, 0.75)',
    borderRadius: Spacing.borderRadius || 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: Spacing.md || 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  glassText: {
    ...Typography.subtitle,
    color: Colors.textPrimary || '#FFFFFF',
    fontWeight: '600',
  },
});

export default Loader;
