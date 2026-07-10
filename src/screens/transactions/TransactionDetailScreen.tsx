import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import GradientBackground from '../../components/common/GradientBackground';
import GlassCard from '../../components/common/GlassCard';
import CustomAlert from '../../components/common/CustomAlert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useTransaction, useDeleteTransaction } from '../../hooks/useTransactions';
import { Colors, Typography, Spacing } from '../../theme';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateTime } from '../../utils/formatDate';

const TransactionDetailScreen: React.FC<any> = ({ navigation, route }) => {
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
    return <LoadingSpinner message="Loading transaction..." />;
  }

  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? Colors.income : Colors.expense;
  const amountBg = isIncome ? Colors.incomeBg : Colors.expenseBg;

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
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
            } catch (error: any) {
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

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction Details</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddTransaction', { id: transaction._id })}
            style={styles.editBtn}>
            <Icon name="create-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Amount Card */}
          <GlassCard style={styles.amountCard}>
            <View style={[styles.typeChip, { backgroundColor: amountBg }]}>
              <Icon
                name={isIncome ? 'arrow-down-outline' : 'arrow-up-outline'}
                size={14}
                color={amountColor}
              />
              <Text style={[styles.typeChipText, { color: amountColor }]}>
                {transaction.type.toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.amountText, { color: amountColor }]}>
              {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
            </Text>
            <Text style={styles.descriptionText}>{transaction.description}</Text>
          </GlassCard>

          {/* Details */}
          <GlassCard>
            <DetailRow icon="grid-outline" label="Category" value={transaction.category} />
            <DetailRow icon="card-outline" label="Payment" value={transaction.paymentMethod} />
            <DetailRow icon="calendar-outline" label="Date" value={formatDateTime(transaction.transactionDate)} />
            {transaction.note ? (
              <DetailRow icon="document-text-outline" label="Note" value={transaction.note} />
            ) : null}
            <DetailRow
              icon="time-outline"
              label="Created"
              value={formatDateTime(transaction.createdAt)}
              isLast
            />
          </GlassCard>

          {/* Delete Button */}
          <TouchableOpacity
            style={styles.deleteBtn}
            activeOpacity={0.8}
            onPress={handleDelete}>
            <Icon name="trash-outline" size={16} color="#F43F5E" />
            <Text style={styles.deleteText}>Delete Transaction</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
};

const DetailRow: React.FC<{
  icon: string;
  label: string;
  value: string;
  isLast?: boolean;
}> = ({ icon, label, value, isLast }) => (
  <View style={[detailStyles.row, !isLast && detailStyles.rowBorder]}>
    <View style={detailStyles.labelContainer}>
      <Icon name={icon} size={18} color={Colors.textSecondary} />
      <Text style={detailStyles.label}>{label}</Text>
    </View>
    <Text style={detailStyles.value}>{value}</Text>
  </View>
);

const detailStyles = StyleSheet.create({
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
    gap: Spacing.sm,
  },
  label: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  value: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    maxWidth: '50%',
    textAlign: 'right',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 40,
    gap: Spacing.base,
  },
  amountCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: Spacing.borderRadiusRound,
    marginBottom: Spacing.md,
  },
  typeChipText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  amountText: {
    ...Typography.h1,
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  descriptionText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  deleteBtn: {
    alignSelf: 'center',
    width: 170,
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
  deleteText: {
    color: '#F43F5E',
    fontWeight: '700',
    fontSize: 13,
  },
});

export default TransactionDetailScreen;
