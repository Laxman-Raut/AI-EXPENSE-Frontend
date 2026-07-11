import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../../components/templates/Screen';
import Card from '../../components/molecules/Card';
import SettingRow from '../../components/molecules/SettingRow';
import CustomAlert from '../../components/molecules/CustomAlert';
import { colors, spacing, typography, radius, shadow } from '../../theme';
import { useAuth } from '../../hooks/useAuth';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [logoutAlertVisible, setLogoutAlertVisible] = useState(false);

  const getInitials = () => {
    if (user?.fullName) {
      const parts = user.fullName.split(' ');
      return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'RK'; // Fallback mockup initials
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
        {/* Custom Confirmation Alert Overlay */}
        <CustomAlert
          visible={logoutAlertVisible}
          title="Logout"
          message="Are you sure you want to sign out?"
          type="warning"
          confirmText="Logout"
          onConfirm={() => {
            setLogoutAlertVisible(false);
            logout();
          }}
          onCancel={() => setLogoutAlertVisible(false)}
        />

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
            onPress={() => Alert.alert('Profile Settings', 'Manage your user profile details.')}
          />
          <SettingRow
            icon="notifications-outline"
            label="Notifications"
            onPress={() => Alert.alert('Notifications', 'Manage your notification preferences.')}
          />
          <SettingRow
            icon="cash-outline"
            label="Currency"
            value="INR (₹)"
            onPress={() => Alert.alert('Currency', 'Currency selection is locked to INR (₹).')}
          />
          <SettingRow
            icon="color-palette-outline"
            label="Theme"
            value="Dark"
            onPress={() => Alert.alert('Theme', 'App theme is locked to Dark.')}
          />
          <SettingRow
            icon="cloud-upload-outline"
            label="Backup & Restore"
            onPress={() => Alert.alert('Backup', 'Database backups are automatically synchronized to the cloud.')}
          />
          <SettingRow
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => Alert.alert('Support', 'Opening Help & Support ticket desk...')}
          />
          <SettingRow
            icon="information-circle-outline"
            label="About App"
            isLast
            onPress={() => Alert.alert('About', 'AboutMoney v1.0.0 - Smart expense tracker.')}
          />
        </Card>

        {/* Logout Action Button */}
        <TouchableOpacity 
          style={styles.logoutBtn} 
          activeOpacity={0.8}
          onPress={() => setLogoutAlertVisible(true)}
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
