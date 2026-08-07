import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { radius } from '../../theme';

const AppLogo = ({ size = 64, style, resizeMode = 'cover' }) => {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={require('../../assets/logo.jpg')}
        style={[styles.image, { width: size, height: size }]}
        resizeMode={resizeMode}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  image: {
    borderRadius: radius.xl,
  },
});

export default AppLogo;
