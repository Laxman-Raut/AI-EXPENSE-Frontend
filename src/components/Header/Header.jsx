import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing } from '../../theme';
import useAppStore from '../../store/useAppStore';

const Header = ({
  title,
  showBackButton = false,
  rightElement,
  onBackPress,
  containerStyle,
}) => {
  const navigation = useNavigation();
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.leftRow}>
        {showBackButton ? (
          <TouchableOpacity
            onPress={handleBack}
            style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}
            activeOpacity={0.7}>
            <Icon
              name="chevron-back"
              size={22}
              color={isDark ? (Colors.textPrimary || '#FFFFFF') : '#111827'}
            />
          </TouchableOpacity>
        ) : null}
        <Text style={[styles.title, { color: isDark ? (Colors.textPrimary || '#FFFFFF') : '#111827' }]}>
          {title}
        </Text>
      </View>
      {rightElement ? <View style={styles.rightContainer}>{rightElement}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base || 16,
    paddingVertical: Spacing.md || 12,
    minHeight: 56,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm || 8,
  },
  title: {
    ...Typography.h3,
    fontWeight: '700',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default Header;
