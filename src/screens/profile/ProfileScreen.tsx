import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import GradientBackground from '../../components/common/GradientBackground';
import GlassCard from '../../components/common/GlassCard';
import CustomAlert from '../../components/common/CustomAlert';
import { useAuth } from '../../hooks/useAuth';
import { Colors, Typography, Spacing } from '../../theme';
import { formatCurrency } from '../../utils/formatCurrency';

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [alertVisible, setAlertVisible] = useState(false);

  const handleLogout = () => {
    setAlertVisible(true);
  };

  const getInitials = () => {
    if (!user?.fullName) return '?';
    const parts = user.fullName.split(' ');
    return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <CustomAlert
          visible={alertVisible}
          title="Logout"
          message="Are you sure you want to logout of your account?"
          type="warning"
          confirmText="Logout"
          onConfirm={() => {
            setAlertVisible(false);
            logout();
          }}
          onCancel={() => setAlertVisible(false)}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Profile</Text>
          </View>

          {/* Avatar & Name */}
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </View>
            <Text style={styles.fullName}>{user?.fullName || 'User'}</Text>
            <Text style={styles.email}>{user?.email || ''}</Text>
          </View>

          {/* Info Cards */}
          <GlassCard style={styles.infoCard}>
            <ProfileRow
              icon="cash-outline"
              label="Currency"
              value={user?.currency || 'INR'}
            />
            <ProfileRow
              icon="wallet-outline"
              label="Monthly Budget"
              value={formatCurrency(user?.monthlyBudget || 0)}
            />
            <ProfileRow
              icon="shield-checkmark-outline"
              label="Verified"
              value={user?.isVerified ? 'Yes' : 'No'}
              isLast
            />
          </GlassCard>

          {/* Menu Items */}
          <GlassCard style={styles.menuCard}>
            <MenuItem icon="settings-outline" label="Settings" />
            <MenuItem icon="help-circle-outline" label="Help & Support" />
            <MenuItem icon="information-circle-outline" label="About" isLast />
          </GlassCard>

          {/* App Version */}
          <Text style={styles.versionText}>ExpenseAI v1.0.0</Text>

          {/* Logout */}
          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.8}
            onPress={handleLogout}>
            <Icon name="log-out-outline" size={16} color="#F43F5E" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
};

const ProfileRow: React.FC<{
  icon: string;
  label: string;
  value: string;
  isLast?: boolean;
}> = ({ icon, label, value, isLast }) => (
  <View style={[rowStyles.row, !isLast && rowStyles.rowBorder]}>
    <View style={rowStyles.labelContainer}>
      <Icon name={icon} size={20} color={Colors.primary} />
      <Text style={rowStyles.label}>{label}</Text>
    </View>
    <Text style={rowStyles.value}>{value}</Text>
  </View>
);

const MenuItem: React.FC<{
  icon: string;
  label: string;
  isLast?: boolean;
}> = ({ icon, label, isLast }) => (
  <TouchableOpacity style={[rowStyles.row, !isLast && rowStyles.rowBorder]}>
    <View style={rowStyles.labelContainer}>
      <Icon name={icon} size={20} color={Colors.textSecondary} />
      <Text style={rowStyles.label}>{label}</Text>
    </View>
    <Icon name="chevron-forward" size={18} color={Colors.textMuted} />
  </TouchableOpacity>
);

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  label: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  value: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.md,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.base,
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  avatarText: {
    ...Typography.h2,
    color: Colors.textPrimary,
  },
  fullName: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  email: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  infoCard: {
    marginHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.base,
  },
  menuCard: {
    marginHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.xl,
  },
  versionText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  logoutBtn: {
    alignSelf: 'center',
    width: 130,
    height: 40,
    borderWidth: 1.2,
    borderColor: '#F43F5E',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.base,
  },
  logoutText: {
    color: '#F43F5E',
    fontWeight: '700',
    fontSize: 13,
  },
});

export default ProfileScreen;
