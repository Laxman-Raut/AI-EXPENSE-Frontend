import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, spacing, typography, radius } from '../../theme';
import savingsApi from '../../api/savings';
import CustomAlert from '../../components/molecules/CustomAlert';

const PRESET_TEMPLATES = [
  { name: 'Emergency Fund', icon: '🛡️', color: '#FF6B6B', defaultTarget: '50000' },
  { name: 'Laptop', icon: '💻', color: '#4C6EF5', defaultTarget: '75000' },
  { name: 'Bike / Car', icon: '🏍️', color: '#FD7E14', defaultTarget: '120000' },
  { name: 'Vacation', icon: '🏖️', color: '#20C997', defaultTarget: '30000' },
  { name: 'Education', icon: '🎓', color: '#7950F2', defaultTarget: '100000' },
  { name: 'House', icon: '🏠', color: '#40C057', defaultTarget: '500000' },
  { name: 'Custom Jar', icon: '🏆', color: '#E599F7', defaultTarget: '' },
];

const EMOJI_OPTIONS = ['🏆', '🛡️', '💻', '🏍️', '🏖️', '🎓', '🏠', '🚗', '📱', '✈️', '🎁', '💍', '💰', '🚀'];

const COLOR_OPTIONS = [
  '#4C6EF5',
  '#40C057',
  '#FD7E14',
  '#E599F7',
  '#FCC419',
  '#20C997',
  '#FF6B6B',
  '#7950F2',
];

const CreateSavingsJarScreen = ({ route, navigation }) => {
  const existingJar = route.params?.jar;
  const isEditing = Boolean(existingJar);

  const [name, setName] = useState(existingJar?.name || '');
  const [icon, setIcon] = useState(existingJar?.icon || '🏆');
  const [color, setColor] = useState(existingJar?.color || '#4C6EF5');
  const [targetAmount, setTargetAmount] = useState(
    existingJar?.targetAmount ? String(existingJar.targetAmount) : ''
  );
  const [notes, setNotes] = useState(existingJar?.notes || '');
  const [loading, setLoading] = useState(false);

  // Custom Themed Alert State
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: [],
    onPress: null,
  });

  const showAlert = (title, message, type = 'info', buttons = [], onPress = null) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      buttons: buttons.length ? buttons : [{ text: 'OK' }],
      onPress,
    });
  };

  const handleSelectPreset = (preset) => {
    setName(preset.name === 'Custom Jar' ? '' : preset.name);
    setIcon(preset.icon);
    setColor(preset.color);
    if (preset.defaultTarget) {
      setTargetAmount(preset.defaultTarget);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      showAlert('Required Field', 'Please enter a name for your Savings Jar.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        icon,
        color,
        targetAmount: targetAmount.trim() ? Number(targetAmount) : null,
        notes: notes.trim(),
      };

      if (isEditing) {
        await savingsApi.updateJar(existingJar._id, payload);
        showAlert(
          'Jar Updated! 🎉',
          `Your savings goal "${name.trim()}" has been updated successfully.`,
          'success',
          [{ text: 'Done' }],
          () => navigation.goBack()
        );
      } else {
        await savingsApi.createJar(payload);
        showAlert(
          'Savings Goal Set! 🏺',
          `Your new savings jar "${name.trim()}" is ready. Start saving now!`,
          'success',
          [{ text: "Great, Let's Save!" }],
          () => navigation.goBack()
        );
      }
    } catch (err) {
      console.log('[CreateSavingsJar] Submit error:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to save jar';
      const isUpgrade = err?.response?.data?.code === 'UPGRADE_REQUIRED';

      if (isUpgrade) {
        showAlert(
          'Upgrade Required 🚀',
          errMsg,
          'premium',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade to Pro' },
          ],
          (btn) => {
            if (btn.text?.includes('Upgrade')) {
              navigation.navigate('Subscription');
            }
          }
        );
      } else {
        showAlert('Error', errMsg, 'destructive');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="close" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Savings Jar' : 'New Savings Jar'}</Text>
        <TouchableOpacity
          style={[styles.saveHeaderBtn, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.saveHeaderBtnText}>{isEditing ? 'Save' : 'Create'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Preset Templates */}
        {!isEditing ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>QUICK PRESETS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsRow}>
              {PRESET_TEMPLATES.map((tmpl) => (
                <TouchableOpacity
                  key={tmpl.name}
                  style={[
                    styles.presetChip,
                    name === tmpl.name && { borderColor: tmpl.color, backgroundColor: tmpl.color + '15' },
                  ]}
                  onPress={() => handleSelectPreset(tmpl)}
                >
                  <Text style={styles.presetEmoji}>{tmpl.icon}</Text>
                  <Text style={styles.presetName}>{tmpl.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Jar Name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>JAR NAME *</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Emergency Fund, New Bike"
              placeholderTextColor={colors.text.muted}
              value={name}
              onChangeText={setName}
              maxLength={100}
            />
          </View>
        </View>

        {/* Icon & Color Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CHOOSE ICON</Text>
          <View style={styles.emojiGrid}>
            {EMOJI_OPTIONS.map((e) => (
              <TouchableOpacity
                key={e}
                style={[styles.emojiItem, icon === e && styles.emojiItemActive]}
                onPress={() => setIcon(e)}
              >
                <Text style={styles.emojiText}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CHOOSE COLOR</Text>
          <View style={styles.colorRow}>
            {COLOR_OPTIONS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorCircle,
                  { backgroundColor: c },
                  color === c && styles.colorCircleActive,
                ]}
                onPress={() => setColor(c)}
              >
                {color === c ? <Icon name="checkmark" size={16} color="#FFF" /> : null}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Target Amount */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TARGET AMOUNT (OPTIONAL)</Text>
          <View style={styles.inputBox}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              style={styles.textInput}
              placeholder="0 (Leave empty for no target)"
              placeholderTextColor={colors.text.muted}
              keyboardType="numeric"
              value={targetAmount}
              onChangeText={setTargetAmount}
            />
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTES (OPTIONAL)</Text>
          <View style={[styles.inputBox, { height: 80, alignItems: 'flex-start' }]}>
            <TextInput
              style={[styles.textInput, { height: '100%', textAlignVertical: 'top' }]}
              placeholder="Why are you saving for this goal?"
              placeholderTextColor={colors.text.muted}
              multiline
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </View>
      </ScrollView>

      {/* Custom Premium Themed Alert Modal */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onButtonPress={(btn) => {
          setAlertConfig((prev) => ({ ...prev, visible: false }));
          if (alertConfig.onPress) {
            alertConfig.onPress(btn);
          }
        }}
        onCancel={() => {
          setAlertConfig((prev) => ({ ...prev, visible: false }));
          if (alertConfig.onPress) {
            alertConfig.onPress({ style: 'cancel' });
          }
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  saveHeaderBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: radius.full || 20,
  },
  saveHeaderBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl || 40,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.secondary,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  presetsRow: {
    flexDirection: 'row',
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
    gap: 6,
  },
  presetEmoji: {
    fontSize: 16,
  },
  presetName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  emojiItem: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emojiItemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  emojiText: {
    fontSize: 22,
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCircleActive: {
    borderWidth: 3,
    borderColor: '#FFF',
  },
});

export default CreateSavingsJarScreen;
