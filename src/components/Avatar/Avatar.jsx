import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../../theme';

const Avatar = ({
  source,
  name,
  size = 50,
  style,
}) => {
  const getInitials = () => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (source) {
    return (
      <Image
        source={typeof source === 'string' ? { uri: source } : source}
        style={[styles.avatar, containerStyle, style]}
      />
    );
  }

  return (
    <View style={[styles.fallbackContainer, containerStyle, style]}>
      <Text style={[styles.fallbackText, { fontSize: size * 0.4 }]}>
        {getInitials()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    resizeMode: 'cover',
  },
  fallbackContainer: {
    backgroundColor: Colors.primary || '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  fallbackText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default Avatar;
