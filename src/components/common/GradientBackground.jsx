import React from 'react';
import { StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../theme';

const GradientBackground = ({ children, style }) => {
  return (
    <LinearGradient
      colors={[Colors.gradientStart || '#0A0E21', Colors.gradientEnd || '#1A1040', Colors.background || '#0A0E21']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, style]}>
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default GradientBackground;
