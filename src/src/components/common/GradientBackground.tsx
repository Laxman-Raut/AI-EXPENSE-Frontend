import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../../theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

const GradientBackground: React.FC<Props> = ({ children, style }) => {
  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientEnd, Colors.background]}
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
