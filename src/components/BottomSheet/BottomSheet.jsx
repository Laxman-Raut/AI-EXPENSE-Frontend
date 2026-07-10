import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing } from '../../theme';
import useAppStore from '../../store/useAppStore';

const BottomSheet = ({
  visible,
  onClose,
  title,
  children,
  maxHeight = '75%',
}) => {
  const theme = useAppStore((state) => state.theme);
  const isDark = theme === 'dark';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        
        <View style={[
          styles.sheet,
          {
            maxHeight,
            backgroundColor: isDark ? (Colors.surface || '#1C1F3B') : '#FFFFFF',
            borderColor: isDark ? (Colors.border || 'rgba(255, 255, 255, 0.08)') : '#E2E8F0',
          }
        ]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)' }]} />
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: isDark ? (Colors.textPrimary || '#FFFFFF') : '#111827' }]}>
              {title}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon
                name="close"
                size={22}
                color={isDark ? (Colors.textSecondary || '#A0A3BD') : '#64748B'}
              />
            </TouchableOpacity>
          </View>
          
          {/* Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 14, 33, 0.65)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl || 24,
    paddingVertical: Spacing.md || 12,
  },
  title: {
    ...Typography.subtitle,
    fontWeight: '700',
  },
  closeButton: {
    padding: Spacing.xs || 4,
  },
  content: {
    paddingHorizontal: Spacing.xl || 24,
    paddingBottom: 40,
  },
});

export default BottomSheet;
