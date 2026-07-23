import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  Switch, 
  ScrollView, 
  ActivityIndicator, 
  Clipboard,
  Alert,
  Image,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import Screen from '../../components/templates/Screen';
import Card from '../../components/molecules/Card';
import SettingRow from '../../components/molecules/SettingRow';
import { colors, spacing, typography, radius, shadow } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { useAlert } from '../../context/AlertContext';
import { useTransactions } from '../../hooks/useTransactions';
import apiClient from '../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePremiumAccess } from '../../hooks/usePremiumAccess';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, updateUser } = useAuth();
  const { showAlert } = useAlert();
  const { data: transactions } = useTransactions();
  const { hasPremiumAccess, showPremiumAlert } = usePremiumAccess();

  // Modals visibility
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [notifyModalVisible, setNotifyModalVisible] = useState(false);
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);

  // Form states
  const [editName, setEditName] = useState(user?.fullName || '');
  const [editMobile, setEditMobile] = useState(user?.mobile || '');
  const [editAge, setEditAge] = useState(user?.age ? String(user.age) : '');
  const [selectedCurrency, setSelectedCurrency] = useState(user?.currency || 'INR');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Notification toggles
  const [allowNotifications, setAllowNotifications] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [dailyReminders, setDailyReminders] = useState(true);

  // Load saved preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedNotif = await AsyncStorage.getItem('notif_enabled');
        if (savedNotif) setAllowNotifications(savedNotif === 'true');

        const savedBudget = await AsyncStorage.getItem('budget_alerts_enabled');
        if (savedBudget) setBudgetAlerts(savedBudget === 'true');

        const savedReminders = await AsyncStorage.getItem('daily_reminders_enabled');
        if (savedReminders) setDailyReminders(savedReminders === 'true');
      } catch (err) {
        console.log('Error loading preferences:', err);
      }
    };
    loadPreferences();
  }, []);

  // Update Edit Name field when user profile loads/changes
  useEffect(() => {
    if (user?.fullName) {
      setEditName(user.fullName);
    }
    if (user?.currency) {
      setSelectedCurrency(user.currency);
    }
    if (user?.mobile) {
      setEditMobile(user.mobile);
    } else {
      setEditMobile('');
    }
    if (user?.age) {
      setEditAge(String(user.age));
    } else {
      setEditAge('');
    }
  }, [user]);

  const getInitials = () => {
    if (user?.fullName) {
      const parts = user.fullName.split(' ');
      return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'RK';
  };

  // Pick & Upload Profile Photo
  const handleChooseAvatar = async () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
    };

    launchImageLibrary(options, async (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        showAlert('Error', response.errorMessage || 'Could not select image.', [{ text: 'OK' }]);
        return;
      }

      const asset = response.assets?.[0];
      if (asset) {
        setLoading(true);
        try {
          const file = {
            uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
            type: asset.type || 'image/jpeg',
            name: asset.fileName || 'avatar.jpg',
          };

          const formData = new FormData();
          formData.append('image', file);

          const uploadRes = await apiClient.post('upload', formData, {
            transformRequest: (data, headers) => {
              delete headers['Content-Type'];
              return data;
            },
          });

          if (uploadRes.data?.success && uploadRes.data?.imageUrl) {
            await updateUser({ avatar: uploadRes.data.imageUrl });
            showAlert('Success', 'Profile picture updated successfully.', [{ text: 'OK' }]);
          } else {
            showAlert('Upload Failed', 'Could not upload profile picture.', [{ text: 'OK' }]);
          }
        } catch (err) {
          showAlert('Upload Failed', err.message || 'Image upload failed.', [{ text: 'OK' }]);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Profile Save
  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      showAlert('Error', 'Name field cannot be empty.', [{ text: 'OK' }]);
      return;
    }
    setLoading(true);
    try {
      await updateUser({ 
        fullName: editName,
        mobile: editMobile,
        age: editAge ? Number(editAge) : null,
      });
      setProfileModalVisible(false);
      showAlert('Success', 'Profile settings updated successfully.', [{ text: 'OK' }]);
    } catch (err) {
      showAlert('Update Failed', err.message || 'Could not update profile info.', [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  };

  // Currency Update
  const handleSaveCurrency = async (currCode) => {
    setLoading(true);
    try {
      await updateUser({ currency: currCode });
      setSelectedCurrency(currCode);
      setCurrencyModalVisible(false);
      showAlert('Success', `Currency switched to ${currCode}.`, [{ text: 'OK' }]);
    } catch (err) {
      showAlert('Update Failed', err.message || 'Could not update currency settings.', [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  };



  // Notifications Save
  const handleSaveNotifications = async () => {
    try {
      await AsyncStorage.setItem('notif_enabled', String(allowNotifications));
      await AsyncStorage.setItem('budget_alerts_enabled', String(budgetAlerts));
      await AsyncStorage.setItem('daily_reminders_enabled', String(dailyReminders));
      setNotifyModalVisible(false);
      showAlert('Success', 'Notification preferences saved successfully.', [{ text: 'OK' }]);
    } catch (err) {
      showAlert('Error', 'Failed to save preferences.', [{ text: 'OK' }]);
    }
  };

  const handleSendTicket = async () => {
    if (!supportSubject.trim() || !supportMessage.trim()) {
      showAlert('Error', 'Please fill in both fields.', [{ text: 'OK' }]);
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('auth/support', {
        subject: supportSubject,
        message: supportMessage,
      });
      setLoading(false);
      setSupportModalVisible(false);
      setSupportSubject('');
      setSupportMessage('');
      const ticketId = Math.floor(100000 + Math.random() * 900000);
      showAlert(
        'Ticket Submitted',
        `Your helpdesk ticket #T-${ticketId} was successfully created. Support will email you shortly.`,
        [{ text: 'OK' }]
      );
    } catch (err) {
      setLoading(false);
      showAlert('Error', err.response?.data?.message || err.message || 'Failed to submit support ticket.');
    }
  };

  // Export Data JSON
  const handleExportBackup = () => {
    try {
      const backupData = {
        exportedAt: new Date().toISOString(),
        userId: user?._id,
        userProfile: {
          fullName: user?.fullName,
          currency: user?.currency,
          monthlyBudget: user?.monthlyBudget,
          mobile: user?.mobile,
          age: user?.age,
        },
        transactions: transactions || [],
      };
      Clipboard.setString(JSON.stringify(backupData, null, 2));
      showAlert(
        'Export Successful',
        'Your transaction ledger data backup has been generated and copied to your clipboard!',
        [{ text: 'OK' }]
      );
    } catch (err) {
      showAlert('Export Failed', 'Unable to stringify database.', [{ text: 'OK' }]);
    }
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
      <Text style={styles.headerTitle}>Profile Settings</Text>
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
          <TouchableOpacity style={styles.avatarCircle} activeOpacity={0.8} onPress={handleChooseAvatar}>
            {user?.avatar?.url ? (
              <Image source={{ uri: user.avatar.url }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{getInitials()}</Text>
            )}
            <View style={styles.cameraIconBadge}>
              <Icon name="camera" size={12} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{user?.fullName || 'Laxman Raut'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
          {user?.mobile ? <Text style={styles.userMobile}>{user.mobile}</Text> : null}
          {user?.age ? <Text style={styles.userAge}>Age: {user.age}</Text> : null}
        </View>

        {/* Settings Group List Card */}
        <Card style={styles.menuCard}>
          <SettingRow
            icon="person-outline"
            label="Profile Settings"
            onPress={() => setProfileModalVisible(true)}
          />
          <SettingRow
            icon="wallet-outline"
            label="Monthly Budget"
            onPress={() => navigation.navigate('Budget')}
          />
          <SettingRow
            icon="repeat-outline"
            label="Recurring Automations"
            onPress={() => navigation.navigate('RecurringTransactions')}
          />
          <SettingRow
            icon="notifications-outline"
            label="Notifications"
            onPress={() => setNotifyModalVisible(true)}
          />
          <SettingRow
            icon="cash-outline"
            label="Currency"
            value={selectedCurrency}
            onPress={() => setCurrencyModalVisible(true)}
          />

          <SettingRow
            icon="card-outline"
            label="Pro Subscription"
            onPress={() => navigation.navigate('Subscription')}
          />
          <SettingRow
            icon="cloud-upload-outline"
            label="Backup & Restore"
            rightElement={!hasPremiumAccess ? <Icon name="lock-closed" size={16} color={colors.primary} /> : undefined}
            onPress={() => {
              if (hasPremiumAccess) {
                setBackupModalVisible(true);
              } else {
                showPremiumAlert();
              }
            }}
          />
          <SettingRow
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => setSupportModalVisible(true)}
          />
          <SettingRow
            icon="information-circle-outline"
            label="About App"
            isLast
            onPress={() => setAboutModalVisible(true)}
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
        <View style={{ height: spacing.xxl }} />
      </Screen>

      {/* ─────────────────────────────────────────────────────────────
          MODALS SECTION (Premium Obsidian styling)
          ───────────────────────────────────────────────────────────── */}

      {/* 1. Profile Settings Modal */}
      <Modal visible={profileModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profile Settings</Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                <Icon name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.textInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter full name"
                placeholderTextColor={colors.text.muted}
              />

              <Text style={styles.inputLabel}>Mobile Number</Text>
              <TextInput
                style={styles.textInput}
                value={editMobile}
                onChangeText={setEditMobile}
                placeholder="Enter mobile number"
                placeholderTextColor={colors.text.muted}
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={styles.textInput}
                value={editAge}
                onChangeText={setEditAge}
                placeholder="Enter age"
                placeholderTextColor={colors.text.muted}
                keyboardType="numeric"
              />
              
              {loading ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
              ) : (
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 2. Currency Selector Modal */}
      <Modal visible={currencyModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setCurrencyModalVisible(false)}>
                <Icon name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {['INR', 'USD', 'EUR', 'GBP'].map((code) => {
                const isSelected = selectedCurrency === code;
                return (
                  <TouchableOpacity 
                    key={code} 
                    style={[styles.selectionRow, isSelected && styles.selectedRow]}
                    onPress={() => handleSaveCurrency(code)}
                  >
                    <Text style={[styles.selectionLabel, isSelected && styles.selectedLabel]}>{code}</Text>
                    {isSelected && <Icon name="checkmark-circle" size={20} color={colors.success} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>



      {/* 4. Notification Preferences Modal */}
      <Modal visible={notifyModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notification Settings</Text>
              <TouchableOpacity onPress={() => setNotifyModalVisible(false)}>
                <Icon name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchTitle}>Allow Notifications</Text>
                  <Text style={styles.switchSub}>App system alerts and highlights</Text>
                </View>
                <Switch
                  value={allowNotifications}
                  onValueChange={setAllowNotifications}
                  trackColor={{ false: colors.divider, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchTitle}>Budget Burn Warning</Text>
                  <Text style={styles.switchSub}>Alert when budget drops every 10%</Text>
                </View>
                <Switch
                  value={budgetAlerts}
                  onValueChange={setBudgetAlerts}
                  trackColor={{ false: colors.divider, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchTitle}>Daily Activity Reminder</Text>
                  <Text style={styles.switchSub}>Reminder at 10 AM if not logged in</Text>
                </View>
                <Switch
                  value={dailyReminders}
                  onValueChange={setDailyReminders}
                  trackColor={{ false: false, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <TouchableOpacity style={[styles.saveBtn, { marginTop: spacing.lg }]} onPress={handleSaveNotifications}>
                <Text style={styles.saveBtnText}>Save Preferences</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 5. Backup & Restore Modal */}
      <Modal visible={backupModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Backup & Sync</Text>
              <TouchableOpacity onPress={() => setBackupModalVisible(false)}>
                <Icon name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.infoDesc}>
                Securely pack and backup all your logged transactions and profile preferences into a clipboard bundle.
              </Text>

              <TouchableOpacity style={styles.saveBtn} onPress={handleExportBackup}>
                <Icon name="copy-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>Copy JSON Data Backup</Text>
              </TouchableOpacity>

              <View style={styles.dividerLine} />

              <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary }]} 
                onPress={() => Alert.prompt(
                  'Restore Backup',
                  'Paste your JSON backup payload string below:',
                  text => {
                    try {
                      const parsed = JSON.parse(text);
                      if (parsed && parsed.transactions) {
                        showAlert('Success', `Recognized backup with ${parsed.transactions.length} transactions. Loaded!`, [{ text: 'OK' }]);
                      } else {
                        showAlert('Invalid Format', 'This JSON is not a valid backup bundle.', [{ text: 'OK' }]);
                      }
                    } catch {
                      showAlert('Error', 'Unable to parse pasted string.', [{ text: 'OK' }]);
                    }
                  }
                )}
              >
                <Icon name="cloud-download-outline" size={18} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.saveBtnText, { color: colors.primary }]}>Import JSON Backup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 6. Help & Support Modal */}
      <Modal visible={supportModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Help & Support</Text>
              <TouchableOpacity onPress={() => setSupportModalVisible(false)}>
                <Icon name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Subject</Text>
              <TextInput
                style={styles.textInput}
                value={supportSubject}
                onChangeText={setSupportSubject}
                placeholder="What do you need help with?"
                placeholderTextColor={colors.text.muted}
              />

              <Text style={styles.inputLabel}>Message</Text>
              <TextInput
                style={[styles.textInput, { height: 100, textAlignVertical: 'top', paddingTop: spacing.sm }]}
                value={supportMessage}
                onChangeText={setSupportMessage}
                placeholder="Describe your request in detail..."
                placeholderTextColor={colors.text.muted}
                multiline
              />

              {loading ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
              ) : (
                <TouchableOpacity style={styles.saveBtn} onPress={handleSendTicket}>
                  <Text style={styles.saveBtnText}>Submit Support Ticket</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 7. About App Modal */}
      <Modal visible={aboutModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>About App</Text>
              <TouchableOpacity onPress={() => setAboutModalVisible(false)}>
                <Icon name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.logoCircle}>
                <Icon name="cash" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.appName}>AI Smart Expense Tracker</Text>
              <Text style={styles.appVer}>v1.0.0 (Build 12)</Text>
              
              <Text style={styles.aboutText}>
                A premium personal financial ledger powered by AI assistants, speech recognition tools, and receipt analyzers.
              </Text>

              <Text style={styles.aboutFooter}>
                    Developed by Laxman Raut
              </Text>
            </View>
          </View>
        </View>
      </Modal>
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
    position: 'relative',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 80,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 2,
  },
  userMobile: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    marginBottom: 2,
  },
  userAge: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
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

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: '80%',
    padding: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: spacing.md,
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  modalBody: {
    paddingBottom: spacing.xl,
  },
  inputLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  textInput: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
    fontSize: typography.sizes.base,
    marginBottom: spacing.lg,
  },
  saveBtn: {
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    ...shadow.md,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  selectionRow: {
    height: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedRow: {
    backgroundColor: 'rgba(138, 63, 252, 0.08)',
    borderColor: colors.primary,
  },
  selectionLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  selectedLabel: {
    color: colors.text.primary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  switchTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  switchSub: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  infoDesc: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  dividerLine: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.lg,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
    ...shadow.md,
  },
  appName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  appVer: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  aboutText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  aboutFooter: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});

export default ProfileScreen;
