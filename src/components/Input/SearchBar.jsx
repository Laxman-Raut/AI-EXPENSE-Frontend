import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing } from '../../theme';

const SearchBar = ({
  value,
  onChangeText,
  placeholder = 'Search transactions...',
  containerStyle,
  onClear,
}) => {
  const handleClear = () => {
    if (onChangeText) onChangeText('');
    if (onClear) onClear();
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Icon
        name="search-outline"
        size={20}
        color={Colors.textSecondary || '#A0A3BD'}
        style={styles.searchIcon}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted || '#6B6E8A'}
        style={styles.input}
      />
      {value ? (
        <TouchableOpacity
          onPress={handleClear}
          style={styles.clearButton}
          activeOpacity={0.7}>
          <Icon
            name="close-circle"
            size={18}
            color={Colors.textSecondary || '#A0A3BD'}
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface || '#1C1F3B',
    borderRadius: Spacing.borderRadiusSmall || 12,
    borderWidth: 1,
    borderColor: Colors.border || 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: Spacing.base || 16,
    height: 48,
    marginVertical: Spacing.sm || 8,
  },
  searchIcon: {
    marginRight: Spacing.sm || 8,
  },
  input: {
    flex: 1,
    ...Typography.body,
    fontSize: 14,
    color: Colors.textPrimary || '#FFFFFF',
    paddingVertical: 0,
  },
  clearButton: {
    padding: Spacing.xs || 4,
  },
});

export default SearchBar;
