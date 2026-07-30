import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, spacing, radius } from '../../theme';

const CustomAlert = ({
  visible,
  title,
  message,
  type = 'info', // 'info' | 'warning' | 'destructive' | 'premium'
  buttons = [],
  onButtonPress,
  onCancel,
}) => {
  if (!visible) return null;

  // Determine icon & gradient based on type or title
  const titleLower = title?.toLowerCase() || '';
  const isPremium = type === 'premium' || titleLower.includes('limit') || titleLower.includes('premium') || titleLower.includes('split') || titleLower.includes('upgrade');
  
  let iconName = 'information-circle';
  let gradientColors = [colors.primary || '#8A3FFC', colors.primaryDark || '#5E1BDB'];
  let glowColor = 'rgba(138, 63, 252, 0.25)';

  if (isPremium) {
    iconName = 'rocket-sharp';
    gradientColors = ['#A366FF', '#8A3FFC', '#5E1BDB'];
    glowColor = 'rgba(163, 102, 255, 0.35)';
  } else if (type === 'warning') {
    iconName = 'alert-circle-sharp';
    gradientColors = ['#FFC107', '#FF9800'];
    glowColor = 'rgba(255, 193, 7, 0.25)';
  } else if (type === 'destructive') {
    iconName = 'close-circle-sharp';
    gradientColors = ['#FF4D67', '#D32F2F'];
    glowColor = 'rgba(255, 77, 103, 0.25)';
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        {/* Backdrop dismiss touchable */}
        <TouchableOpacity 
          style={StyleSheet.absoluteFillObject} 
          activeOpacity={1} 
          onPress={onCancel} 
        />

        <View style={styles.cardContainer}>
          {/* Top Decorative Glow Ring */}
          <View style={[styles.glowRing, { backgroundColor: glowColor }]} />

          {/* Header Icon Badge */}
          <View style={styles.iconBadgeWrapper}>
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconBadge}
            >
              <Icon name={iconName} size={28} color="#FFFFFF" />
            </LinearGradient>
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Description Message */}
          {message ? <Text style={styles.message}>{message}</Text> : null}

          {/* Feature Badge if Premium */}
          {isPremium && (
            <View style={styles.premiumFeatureBadge}>
              <Icon name="sparkles" size={13} color="#A366FF" style={{ marginRight: 5 }} />
              <Text style={styles.premiumFeatureText}>PRO Plan Feature</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            {buttons.map((btn, index) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              const isUpgrade = btn.text?.toLowerCase().includes('upgrade');

              if (isUpgrade || (!isCancel && !isDestructive && isPremium)) {
                return (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.8}
                    style={styles.fullWidthBtn}
                    onPress={() => onButtonPress(btn)}
                  >
                    <LinearGradient
                      colors={['#A366FF', '#8A3FFC']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.gradientBtn}
                    >
                      <Text style={styles.gradientBtnText}>{btn.text}</Text>
                      <Icon name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    </LinearGradient>
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.7}
                  style={[
                    styles.standardBtn,
                    isCancel ? styles.cancelBtn : isDestructive ? styles.destructiveBtn : styles.primaryBtn,
                  ]}
                  onPress={() => onButtonPress(btn)}
                >
                  <Text
                    style={[
                      styles.standardBtnText,
                      isCancel ? styles.cancelBtnText : isDestructive ? styles.destructiveBtnText : styles.primaryBtnText,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 10, 15, 0.85)', // Obsidian dark overlay
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg || 16,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 330,
    backgroundColor: '#141622', // Sleek surface slate
    borderRadius: radius.xl || 24,
    borderWidth: 1,
    borderColor: '#24283B',
    padding: spacing.xl || 20,
    alignItems: 'center',
    shadowColor: '#8A3FFC',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  glowRing: {
    position: 'absolute',
    top: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    alignSelf: 'center',
  },
  iconBadgeWrapper: {
    marginBottom: spacing.md || 12,
    marginTop: spacing.xs || 4,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8A3FFC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 13.5,
    color: '#9CA3AF',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.lg || 16,
    paddingHorizontal: 4,
  },
  premiumFeatureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(138, 63, 252, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(163, 102, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: spacing.lg || 16,
  },
  premiumFeatureText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#A366FF',
    letterSpacing: 0.5,
  },
  actions: {
    width: '100%',
    gap: 8,
  },
  fullWidthBtn: {
    width: '100%',
    borderRadius: radius.lg || 14,
    overflow: 'hidden',
  },
  gradientBtn: {
    height: 46,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.lg || 14,
    paddingHorizontal: 16,
  },
  gradientBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  standardBtn: {
    height: 44,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.lg || 14,
    borderWidth: 1,
  },
  primaryBtn: {
    backgroundColor: '#8A3FFC',
    borderColor: '#A366FF',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelBtn: {
    backgroundColor: 'transparent',
    borderColor: '#24283B',
  },
  cancelBtnText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  destructiveBtn: {
    backgroundColor: 'rgba(255, 77, 103, 0.1)',
    borderColor: 'rgba(255, 77, 103, 0.3)',
  },
  destructiveBtnText: {
    color: '#FF4D67',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CustomAlert;

