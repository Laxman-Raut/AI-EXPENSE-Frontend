import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../../components/templates/Screen';
import Card from '../../components/molecules/Card';
import Input from '../../components/atoms/Input';
import PrimaryButton from '../../components/atoms/PrimaryButton';
import { colors, spacing, typography, radius } from '../../theme';
import { useAlert } from '../../context/AlertContext';

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food', icon: 'fast-food-outline', color: '#FF9500' },
  { name: 'Shopping', icon: 'bag-handle-outline', color: '#FF2D55' },
  { name: 'Travel', icon: 'car-outline', color: '#5856D6' },
  { name: 'Grocery', icon: 'cart-outline', color: '#34C759' },
  { name: 'Rent', icon: 'home-outline', color: '#AF52DE' },
  { name: 'Investments', icon: 'trending-up-outline', color: '#007AFF' },
  { name: 'Health', icon: 'heart-outline', color: '#FF3B30' },
  { name: 'EMI/Bill', icon: 'receipt-outline', color: '#FFCC00' },
  { name: 'Subscriptions', icon: 'tv-outline', color: '#5AC8FA' },
  { name: 'Others', icon: 'ellipsis-horizontal-outline', color: '#8E8E93' },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', icon: 'cash-outline', color: '#34C759' },
  { name: 'Freelance / Business', icon: 'briefcase-outline', color: '#007AFF' },
  { name: 'Investments', icon: 'trending-up-outline', color: '#5856D6' },
  { name: 'Rental Income', icon: 'key-outline', color: '#AF52DE' },
  { name: 'Gifts & Rewards', icon: 'gift-outline', color: '#FF9500' },
  { name: 'Refunds & Cashback', icon: 'trophy-outline', color: '#FFCC00' },
  { name: 'Dividends & Interest', icon: 'pie-chart-outline', color: '#5AC8FA' },
  { name: 'Others', icon: 'ellipsis-horizontal-outline', color: '#8E8E93' },
];

const CategoriesScreen = ({ navigation, route }) => {
  const isIncomeType = route.params?.type === 'income';
  const initialCategoryList = isIncomeType ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
  const [categories, setCategories] = useState(initialCategoryList);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const { showAlert } = useAlert();

  const handleAddCategory = () => {
    setAddModalVisible(true);
  };

  const handleConfirmAdd = () => {
    const name = newCategoryName;
    if (!name || name.trim().length === 0) {
      showAlert('Error', 'Category name cannot be empty.');
      return;
    }
    const exists = categories.some(cat => cat.name.toLowerCase() === name.trim().toLowerCase());
    if (exists) {
      showAlert('Error', 'Category already exists.');
      return;
    }
    const newCat = {
      name: name.trim(),
      icon: 'pricetag-outline',
      color: colors.primary,
    };
    setCategories([...categories, newCat]);
    setAddModalVisible(false);
    setNewCategoryName('');
  };

  // Custom Header
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>
        {isIncomeType ? 'Income Categories' : 'Expense Categories'}
      </Text>
      <TouchableOpacity style={styles.searchBtn} activeOpacity={0.7}>
        <Icon name="search-outline" size={22} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.root}>
      <Screen
        scrollable
        header={renderHeader()}
        style={styles.contentContainer}
      >
        {/* Category List */}
        <View style={styles.listContainer}>
          {categories.map((cat, idx) => (
            <TouchableOpacity
              key={cat.name + idx}
              style={[
                styles.categoryRow,
                idx === categories.length - 1 ? { borderBottomWidth: 0 } : null
              ]}
              activeOpacity={0.7}
              onPress={() => {
                if (route.params?.isSelection) {
                  // Use goBack() + callback so the calling screen stays mounted
                  // and none of its state (amount, notes, etc.) is lost
                  if (route.params?.onCategorySelect) {
                    route.params.onCategorySelect(cat.name);
                  }
                  navigation.goBack();
                } else {
                  showAlert('Category Info', `Manage transactions under ${cat.name}`);
                }
              }}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: cat.color + '15' }]}>
                  <Icon name={cat.icon} size={20} color={cat.color} />
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </View>
              <Icon name="chevron-forward" size={16} color={colors.text.muted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Add Category Button */}
        <View style={styles.btnContainer}>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={handleAddCategory}
            activeOpacity={0.8}
          >
            <Icon name="add" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.addBtnText}>Add Category</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </Screen>

      {/* New Category Prompt Modal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Category</Text>
            
            <Input
              label="Category Name"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="e.g. Health"
              autoFocus
            />

            <View style={styles.modalActions}>
              <PrimaryButton 
                title="Cancel" 
                onPress={() => {
                  setAddModalVisible(false);
                  setNewCategoryName('');
                }} 
                type="ghost"
                style={styles.modalCancel}
              />
              <PrimaryButton 
                title="Add" 
                onPress={handleConfirmAdd} 
                type="primary"
                style={styles.modalConfirm}
              />
            </View>
          </Card>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? spacing.sm : spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  searchBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  listContainer: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl * 1.5,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    fontWeight: typography.weights.semibold,
  },
  btnContainer: {
    paddingHorizontal: spacing.xs,
  },
  addBtn: {
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    width: '100%',
    padding: spacing.xl,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  modalCancel: {
    flex: 1,
  },
  modalConfirm: {
    flex: 1,
  },
});

export default CategoriesScreen;
