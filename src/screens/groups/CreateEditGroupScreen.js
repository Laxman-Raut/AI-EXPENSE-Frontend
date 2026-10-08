import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { colors, spacing, typography, radius } from '../../theme';
import { useGroups } from '../../hooks/useGroups';
import { useAlert } from '../../context/AlertContext';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=150&q=80',
];

const CreateEditGroupScreen = ({ route, navigation }) => {
  const isEditing = route.params?.isEditing || false;
  const existingGroup = route.params?.group || null;

  const [name, setName] = useState(existingGroup?.name || '');
  const [description, setDescription] = useState(existingGroup?.description || '');
  const [avatar, setAvatar] = useState(existingGroup?.avatar || '');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const { createGroup, updateGroup } = useGroups();
  const { showAlert } = useAlert();

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!name.trim()) {
      showAlert('Required Field', 'Please enter a group name.', [{ text: 'OK' }], 'warning');
      return;
    }

    if (name.trim().length < 3) {
      showAlert('Validation Error', 'Group name must be at least 3 characters long.', [{ text: 'OK' }], 'warning');
      return;
    }

    savingRef.current = true;
    setSaving(true);
    try {
      if (isEditing && existingGroup?._id) {
        await updateGroup(existingGroup._id, {
          name: name.trim(),
          description: description.trim(),
          avatar,
        });
        showAlert('Success', 'Group updated successfully!', [
          { text: 'Awesome', onPress: () => navigation.goBack() },
        ], 'success');
      } else {
        await createGroup({
          name: name.trim(),
          description: description.trim(),
          avatar,
        });
        showAlert('Success', 'Group created successfully! 🎉', [
          { text: 'Awesome', onPress: () => navigation.goBack() },
        ], 'success');
      }
    } catch (err) {
      showAlert('Error', err?.response?.data?.message || 'Failed to save group', [{ text: 'OK' }], 'destructive');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={22} color={colors.text.primary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Group' : 'Create New Group'}
          </Text>

          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Selector */}
          <Text style={styles.sectionLabel}>Group Icon / Avatar</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.avatarRow}
          >
            <TouchableOpacity
              style={[
                styles.avatarOption,
                !avatar && styles.avatarOptionSelected,
              ]}
              onPress={() => setAvatar('')}
            >
              <View style={styles.avatarDefault}>
                <Icon name="people-outline" size={24} color={colors.primary} />
              </View>
            </TouchableOpacity>

            {PRESET_AVATARS.map((url, idx) => {
              const isSelected = avatar === url;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.avatarOption,
                    isSelected && styles.avatarOptionSelected,
                  ]}
                  onPress={() => setAvatar(url)}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark || '#5E1BDB']}
                    style={styles.avatarPresetGradient}
                  >
                    <Icon name="images-outline" size={20} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Group Name Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Group Name <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <Icon name="people-outline" size={20} color={colors.text.secondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Trip to Paris, Apartment Roomies"
                placeholderTextColor={colors.text.muted}
                value={name}
                onChangeText={setName}
                maxLength={50}
              />
            </View>
          </View>

          {/* Description Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="What is this group for?"
                placeholderTextColor={colors.text.muted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark || '#5E1BDB']}
              style={styles.submitGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Icon name={isEditing ? 'checkmark' : 'add'} size={22} color="#fff" />
                  <Text style={styles.submitText}>
                    {isEditing ? 'Save Changes' : 'Create Group'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes?.lg || 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl || 40,
  },
  sectionLabel: {
    fontSize: typography.sizes?.sm || 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  avatarRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  avatarOption: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  avatarOptionSelected: {
    borderColor: colors.primary,
  },
  avatarDefault: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPresetGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.sizes?.sm || 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  required: {
    color: colors.danger,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg || 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 50,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.sizes?.md || 15,
  },
  textAreaWrapper: {
    height: 90,
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  textArea: {
    height: '100%',
    textAlignVertical: 'top',
  },
  submitBtn: {
    borderRadius: radius.lg || 14,
    overflow: 'hidden',
    marginTop: spacing.lg,
  },
  submitGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md + 2,
    gap: spacing.xs,
  },
  submitText: {
    color: '#fff',
    fontSize: typography.sizes?.md || 16,
    fontWeight: '700',
  },
});

export default CreateEditGroupScreen;
