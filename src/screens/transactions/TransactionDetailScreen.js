import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../../components/templates/Screen';
import Card from '../../components/molecules/Card';
import Header from '../../components/molecules/Header';
import PrimaryButton from '../../components/atoms/PrimaryButton';
import CustomAlert from '../../components/molecules/CustomAlert';
import { colors, spacing, typography, radius, shadow } from '../../theme';
import { useTransaction, useDeleteTransaction } from '../../hooks/useTransactions';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateTime } from '../../utils/formatDate';

const TransactionDetailScreen = ({ navigation, route }) => {
  const { id } = route.params;
  const { data: transaction, isLoading } = useTransaction(id);
  const deleteMutation = useDeleteTransaction();

  const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
  const [errorAlertVisible, setErrorAlertVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleDelete = () => {
    setDeleteAlertVisible(true);
  };

  if (isLoading || !transaction) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? colors.success : colors.danger;
  const amountBg = isIncome ? 'rgba(0, 210, 106, 0.08)' : 'rgba(255, 77, 103, 0.08)';

  const renderHeader = () => (
    <Header
      title="Transaction Details"
      leftIcon={<Icon name="chevron-back" size={24} color={colors.text.primary} />}
      onLeftPress={() => navigation.goBack()}
      rightIcon={<Icon name="create-outline" size={20} color={colors.primary} />}
      onRightPress={() => navigation.navigate('AddTransaction', { id: transaction._id })}
    />
  );

  return (
    <View style={styles.root}>
      <Screen 
        header={renderHeader()}
        style={styles.contentContainer}
      >
        <CustomAlert
          visible={deleteAlertVisible}
          title="Delete Transaction"
          message="Are you sure you want to delete this transaction? This action cannot be undone."
          type="destructive"
          confirmText="Delete"
          onConfirm={async () => {
            setDeleteAlertVisible(false);
            try {
              await deleteMutation.mutateAsync(id);
              navigation.goBack();
            } catch (error) {
              setErrorMessage(error.message || 'Failed to delete transaction');
              setErrorAlertVisible(true);
            }
          }}
          onCancel={() => setDeleteAlertVisible(false)}
        />

        <CustomAlert
          visible={errorAlertVisible}
          title="Error"
          message={errorMessage}
          type="destructive"
          confirmText="OK"
          onConfirm={() => setErrorAlertVisible(false)}
          onCancel={() => setErrorAlertVisible(false)}
        />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Prominent Amount Card */}
          <Card style={[styles.amountCard, shadow.md]}>
            <View style={[styles.typeChip, { backgroundColor: amountBg }]}>
              <Icon
                name={isIncome ? 'arrow-down' : 'arrow-up'}
                size={14}
                color={amountColor}
              />
              <Text style={[styles.typeChipText, { color: amountColor }]}>
                {transaction.type.toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.amountText, { color: isIncome ? colors.success : colors.text.primary }]}>
              {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
            </Text>
            <Text style={styles.descriptionText}>{transaction.description}</Text>
          </Card>

          {/* Details list Card */}
          <Card style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{transaction.category}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Method</Text>
              <Text style={styles.detailValue}>{transaction.paymentMethod}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date & Time</Text>
              <Text style={styles.detailValue}>{formatDateTime(transaction.transactionDate)}</Text>
            </View>
            <View style={[styles.detailRow, styles.lastRow]}>
              <Text style={styles.detailLabel}>Notes</Text>
              <Text style={styles.detailValue}>{transaction.note || 'None'}</Text>
            </View>
          </Card>

          {/* Delete Action button */}
          <View style={styles.deleteWrapper}>
            <PrimaryButton
              title="Delete Transaction"
              onPress={handleDelete}
              type="danger"
              style={styles.deleteBtn}
            />
          </View>
        </ScrollView>
      </Screen>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingRoot: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  amountCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  typeChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  amountText: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    letterSpacing: -1,
    marginBottom: spacing.xs,
  },
  descriptionText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  detailsCard: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  detailValue: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    fontWeight: typography.weights.bold,
  },
  deleteWrapper: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  deleteBtn: {
    width: 170,
    height: 40,
    borderRadius: radius.md,
  },
});

export default TransactionDetailScreen;
