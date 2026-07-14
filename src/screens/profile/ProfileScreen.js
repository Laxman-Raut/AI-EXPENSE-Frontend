import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../../components/templates/Screen';
import Card from '../../components/molecules/Card';
import SettingRow from '../../components/molecules/SettingRow';
import { colors, spacing, typography, radius, shadow } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { useAlert } from '../../context/AlertContext';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { showAlert } = useAlert();

  const getInitials = () => {
    if (user?.fullName) {
      const parts = user.fullName.split(' ');
      return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'RK'; // Fallback mockup initials
  };

  const showInfoAlert = (title, message) => {
    showAlert(title, message, [{ text: 'OK' }]);
  };

  const handleLogoutPress = () => {
    showAlert(
      'Logout',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ],
      'warning'
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Profile</Text>
    </View>
  );

  return (
    <View style={styles.root}>
      <Screen 
        scrollable 
        header={renderHeader()}
        style={styles.contentContainer}
      >
        {/* User Info Card */}
        <View style={styles.profileHeaderBox}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>
          <Text style={styles.userName}>{user?.fullName || 'Rahul Kumar'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'rahul.kumar@gmail.com'}</Text>
        </View>

        {/* Settings Group List Card */}
        <Card style={styles.menuCard}>
          <SettingRow
            icon="person-outline"
            label="Profile Settings"
            onPress={() => showInfoAlert('Profile Settings', 'Manage your user profile details.')}
          />
          <SettingRow
            icon="wallet-outline"
            label="Monthly Budget"
            onPress={() => navigation.navigate('Budget')}
          />
          <SettingRow
            icon="notifications-outline"
            label="Notifications"
            onPress={() => showInfoAlert('Notifications', 'Manage your notification preferences.')}
          />
          <SettingRow
            icon="cash-outline"
            label="Currency"
            value="INR (₹)"
            onPress={() => showInfoAlert('Currency', 'Currency selection is locked to INR (₹).')}
          />
          <SettingRow
            icon="color-palette-outline"
            label="Theme"
            value="Obsidian"
            onPress={() => showInfoAlert('Theme', 'The app uses a premium Obsidian Dark palette customized for eye comfort.')}
          />
          <SettingRow
            icon="cloud-upload-outline"
            label="Backup & Restore"
            onPress={() => showInfoAlert('Backup', 'Database backups are automatically synchronized to the cloud.')}
          />
          <SettingRow
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => showInfoAlert('Support', 'Opening Help & Support ticket desk...')}
          />
          <SettingRow
            icon="information-circle-outline"
            label="About App"
            isLast
            onPress={() => showInfoAlert('About', 'AboutMoney v1.0.0 - Smart expense tracker.')}
          />
        </Card>

        {/* Logout Action Button */}
        <TouchableOpacity 
          style={styles.logoutBtn} 
          activeOpacity={0.8}
          onPress={handleLogoutPress}
        >
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>

        {/* Scroll footer padding */}
        <View style={{ height: 100 }} />
      </Screen>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  profileHeaderBox: {
    alignItems: 'center',
    marginVertical: spacing.xxl,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
  },
  userName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
  },
  menuCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xxl,
  },
  logoutBtn: {
    height: 52,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  logoutBtnText: {
    color: colors.danger,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
});

export default ProfileScreen;
