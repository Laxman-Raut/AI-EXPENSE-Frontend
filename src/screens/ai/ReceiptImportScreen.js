import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Screen from '../../components/templates/Screen';
import Card from '../../components/molecules/Card';
import Input from '../../components/atoms/Input';
import Header from '../../components/molecules/Header';
import PrimaryButton from '../../components/atoms/PrimaryButton';
import { colors, spacing, typography, radius } from '../../theme';
import { useScanReceipt } from '../../hooks/useAi';
import { useCreateTransaction } from '../../hooks/useTransactions';
import dayjs from 'dayjs';

const ReceiptImportScreen = ({ route, navigation }) => {
  const { sharedImageUri } = route.params || {};
  
  const [imageUri, setImageUri] = useState(sharedImageUri || null);
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  // Form Fields
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [date, setDate] = useState('');

  const scanReceiptMutation = useScanReceipt();
  const createMutation = useCreateTransaction();

  useEffect(() => {
    if (sharedImageUri) {
      setImageUri(sharedImageUri);
      // Auto-trigger scan when screen opens with a shared image
      handleScan(sharedImageUri);
    }
  }, [sharedImageUri]);

  const handleScan = async (uriToScan) => {
    if (!uriToScan) return;
    setScanComplete(false);
    setScanning(true);

    // Build standard React Native File object for FormData
    const file = {
      uri: uriToScan,
      name: 'shared_receipt.jpg',
      type: 'image/jpeg',
    };

    try {
      const result = await scanReceiptMutation.mutateAsync(file);
      if (result && result.success) {
        setMerchant(result.data.merchant || '');
        setAmount(String(result.data.amount || ''));
        setCategory(result.data.category || 'Other');
        setPaymentMethod(result.data.paymentMethod || 'Credit Card');
        
        const rawDate = result.data.transactionDate;
        setDate(rawDate ? dayjs(rawDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'));
        setScanComplete(true);
      } else {
        Alert.alert('Scan Failed', 'Could not parse receipt contents.');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Gemini failed to scan receipt.');
    } finally {
      setScanning(false);
    }
  };

  const handleSave = async () => {
    if (!merchant || !amount || !category) {
      Alert.alert('Error', 'Please fill in all detected fields.');
      return;
    }
    
    const payload = {
      type: 'expense',
      category: category,
      amount: Number(amount),
      description: merchant,
      paymentMethod: paymentMethod || 'UPI',
      transactionDate: date ? dayjs(date).toISOString() : dayjs().toISOString(),
      note: `Imported via Android Share: ${merchant}`,
    };

    try {
      await createMutation.mutateAsync(payload);
      Alert.alert(
        'Success',
        'Transaction parsed and saved to ledger!',
        [{ text: 'OK', onPress: () => navigation.navigate('TodayHome') }]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save transaction.');
    }
  };

  const renderHeader = () => (
    <Header
      title="Import shared receipt"
      leftIcon={<Icon name="close-outline" size={24} color={colors.text.primary} />}
      onLeftPress={() => navigation.navigate('TodayHome')}
    />
  );

  return (
    <View style={styles.root}>
      <Screen 
        scrollable 
        header={renderHeader()}
        style={styles.contentContainer}
      >
        <Text style={styles.hintText}>
          Review and process the receipt shared from your device. Gemini AI is parsing the image.
        </Text>

        {/* Receipt Image Preview */}
        {imageUri && (
          <Card style={styles.previewCard}>
            <Text style={styles.previewLabel}>Imported Receipt</Text>
            <View style={styles.previewFrame}>
              <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
            </View>
            
            {!scanning && !scanComplete && (
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => handleScan(imageUri)}
                style={styles.retryScanBtn}
              >
                <Icon name="sparkles" size={16} color={colors.primary} />
                <Text style={styles.retryScanText}>Retry Scanning</Text>
              </TouchableOpacity>
            )}
          </Card>
        )}

        {/* Scanning Progress */}
        {scanning && (
          <Card style={styles.progressCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <View style={styles.progressInfo}>
              <Text style={styles.progressTitle}>Gemini AI is parsing receipt...</Text>
              <Text style={styles.progressSubtext}>Analyzing merchant data, categorizing items, and parsing pricing...</Text>
            </View>
          </Card>
        )}

        {/* Detected Fields Form */}
        {scanComplete && !scanning && (
          <View style={styles.fieldsSection}>
            <Text style={styles.sectionTitle}>Detected Fields</Text>
            
            <Input
              label="Merchant"
              value={merchant}
              onChangeText={setMerchant}
              placeholder="e.g. Whole Foods"
              icon={<Icon name="business-outline" size={18} color={colors.text.secondary} />}
            />

            <Input
              label="Amount"
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="numeric"
              icon={<Icon name="logo-usd" size={18} color={colors.text.secondary} />}
            />

            <Input
              label="Category"
              value={category}
              onChangeText={setCategory}
              placeholder="e.g. Food"
              icon={<Icon name="grid-outline" size={18} color={colors.text.secondary} />}
            />

            <Input
              label="Payment Method"
              value={paymentMethod}
              onChangeText={setPaymentMethod}
              placeholder="e.g. Credit Card"
              icon={<Icon name="card-outline" size={18} color={colors.text.secondary} />}
            />

            <Input
              label="Date"
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              icon={<Icon name="calendar-outline" size={18} color={colors.text.secondary} />}
            />

            <View style={styles.saveBtnWrapper}>
              <PrimaryButton
                title="Save Transaction"
                onPress={handleSave}
                loading={createMutation.isPending}
                type="primary"
              />
            </View>
          </View>
        )}

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
  hintText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.lineHeights.base + 2,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  previewCard: {
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  previewLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.secondary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  previewFrame: {
    height: 320,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.divider,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  retryScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  retryScanText: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  progressCard: {
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  progressInfo: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  progressTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  progressSubtext: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  fieldsSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  saveBtnWrapper: {
    marginTop: spacing.lg,
  },
});

export default ReceiptImportScreen;
