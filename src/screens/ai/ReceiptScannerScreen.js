import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, ScrollView, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Screen from '../../components/templates/Screen';
import Card from '../../components/molecules/Card';
import Input from '../../components/atoms/Input';
import Header from '../../components/molecules/Header';
import PrimaryButton from '../../components/atoms/PrimaryButton';
import { colors, spacing, typography, radius } from '../../theme';
import { useScanReceipt } from '../../hooks/useAi';
import { useCreateTransaction } from '../../hooks/useTransactions';
import { useAlert } from '../../context/AlertContext';
import dayjs from 'dayjs';

const SAMPLES = [
  {
    title: 'Whole Foods Grocery',
    desc: 'Mock receipt displaying grocery items',
    url: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=600',
    icon: 'cart-outline',
  },
  {
    title: 'Cafe Coffee Invoice',
    desc: 'Mock bill displaying coffee purchases',
    url: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=600',
    icon: 'cafe-outline',
  },
  {
    title: 'Tech Store Bill',
    desc: 'Mock invoice displaying retail purchases',
    url: 'https://images.unsplash.com/photo-1527018601619-a508a2be00cd?q=80&w=600',
    icon: 'laptop-outline',
  },
];

const ReceiptScannerScreen = ({ navigation }) => {
  const { showAlert } = useAlert();
  const [imageUri, setImageUri] = useState(null);
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

  // Scanner animation states
  const laserAnim = React.useRef(new Animated.Value(0)).current;
  const [statusText, setStatusText] = useState('Gemini AI is analyzing invoice...');

  React.useEffect(() => {
    let timer1, timer2, timer3;
    if (scanning) {
      // Loop laser animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 220,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Dynamic text updates to show scanning steps
      timer1 = setTimeout(() => setStatusText('Reading items & total amount...'), 2000);
      timer2 = setTimeout(() => setStatusText('Extracting merchant details...'), 4500);
      timer3 = setTimeout(() => setStatusText('Categorizing transaction...'), 7000);
    } else {
      setStatusText('Gemini AI is analyzing invoice...');
      laserAnim.setValue(0);
    }

    return () => {
      laserAnim.stopAnimation();
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [scanning]);

  const handleSelectImage = async (source) => {
    // Guard against unlinked native modules (requires npm run android)
    if (source === 'camera' && (typeof launchCamera !== 'function' || !launchCamera)) {
      showAlert(
        'Native Library Missing',
        'Camera support requires compiling native modules.\n\nPlease run "npm run android" in your terminal to build the app with camera permissions.\n\nIn the meantime, you can test the AI parser instantly using the sample preset bills below!',
        [{ text: 'OK' }]
      );
      return;
    }
    if (source === 'gallery' && (typeof launchImageLibrary !== 'function' || !launchImageLibrary)) {
      showAlert(
        'Native Library Missing',
        'Gallery support requires compiling native modules.\n\nPlease run "npm run android" in your terminal to build the app with gallery permissions.\n\nIn the meantime, you can test the AI parser instantly using the sample preset bills below!',
        [{ text: 'OK' }]
      );
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: false,
    };

    const callback = async (response) => {
      if (response.didCancel) return;
      if (response.errorMessage) {
        showAlert('Error', response.errorMessage);
        return;
      }
      const asset = response.assets?.[0];
      if (asset) {
        const file = {
          uri: asset.uri,
          name: asset.fileName || 'receipt.jpg',
          type: asset.type || 'image/jpeg',
        };
        setImageUri(asset.uri);
        setScanComplete(false);
        setScanning(true);
        
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
            showAlert('Scan Failed', 'Could not parse receipt contents.');
          }
        } catch (error) {
          showAlert('Error', error.message || 'Gemini failed to scan receipt.');
        } finally {
          setScanning(false);
        }
      }
    };

    try {
      if (source === 'camera') {
        launchCamera(options, callback);
      } else {
        launchImageLibrary(options, callback);
      }
    } catch (err) {
      showAlert(
        'Native Link Failure',
        'Could not open image picker natively. Please run "npm run android" to rebuild the application.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSelectSample = async (sampleUrl) => {
    setImageUri(sampleUrl);
    setScanComplete(false);
    setScanning(true);
    
    try {
      const result = await scanReceiptMutation.mutateAsync(sampleUrl);
      if (result && result.success) {
        setMerchant(result.data.merchant || '');
        setAmount(String(result.data.amount || ''));
        setCategory(result.data.category || 'Other');
        setPaymentMethod(result.data.paymentMethod || 'Credit Card');
        
        const rawDate = result.data.transactionDate;
        setDate(rawDate ? dayjs(rawDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'));
        setScanComplete(true);
      } else {
        showAlert('Scan Failed', 'Could not parse sample receipt.');
      }
    } catch (error) {
      showAlert('Error', error.message || 'Gemini failed to scan sample receipt.');
    } finally {
      setScanning(false);
    }
  };

  const handleSave = async () => {
    if (!merchant || !amount || !category) {
      showAlert('Error', 'Please fill in all detected fields.');
      return;
    }
    
    const payload = {
      type: 'expense',
      category: category,
      amount: Number(amount),
      description: merchant,
      paymentMethod: paymentMethod || 'UPI',
      transactionDate: date ? dayjs(date).toISOString() : dayjs().toISOString(),
      note: `AI Scanned receipt: ${merchant}`,
    };

    try {
      await createMutation.mutateAsync(payload);
      showAlert(
        'Success',
        'Transaction parsed and saved to ledger!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      showAlert('Error', error.message || 'Failed to save transaction.');
    }
  };

  const renderHeader = () => (
    <Header
      title="AI Receipt Scanner"
      leftIcon={<Icon name="chevron-back" size={24} color={colors.text.primary} />}
      onLeftPress={() => navigation.goBack()}
    />
  );

  return (
    <View style={styles.root}>
      <Screen 
        scrollable 
        header={renderHeader()}
        style={styles.contentContainer}
      >
        {/* Step 1: Upload Source Buttons & Samples */}
        {!imageUri && (
          <View style={styles.uploadSection}>
            <Text style={styles.hintText}>
              Scan receipts to automatically extract merchant, amount, category and date details.
            </Text>
            
            <View style={styles.btnRow}>
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => handleSelectImage('camera')}
                style={styles.sourceCard}
              >
                <View style={styles.iconBox}>
                  <Icon name="camera" size={32} color={colors.primary} />
                </View>
                <Text style={styles.sourceText}>Camera</Text>
              </TouchableOpacity>
 
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => handleSelectImage('gallery')}
                style={styles.sourceCard}
              >
                <View style={styles.iconBox}>
                  <Icon name="images" size={32} color={colors.primary} />
                </View>
                <Text style={styles.sourceText}>Gallery</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: spacing.xl, marginBottom: spacing.md, alignSelf: 'flex-start' }]}>
              Or Select a Preset Sample Bill
            </Text>

            {SAMPLES.map(sample => (
              <TouchableOpacity
                key={sample.title}
                activeOpacity={0.85}
                onPress={() => handleSelectSample(sample.url)}
                style={styles.sampleItemCard}
              >
                <View style={styles.sampleLeft}>
                  <View style={styles.sampleIconBox}>
                    <Icon name={sample.icon} size={24} color={colors.primary} />
                  </View>
                  <View style={styles.sampleMeta}>
                    <Text style={styles.sampleTitle}>{sample.title}</Text>
                    <Text style={styles.sampleDesc}>{sample.desc}</Text>
                  </View>
                </View>
                <Icon name="chevron-forward" size={16} color={colors.text.muted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 2: Upload / AI Progress (Animated Scanner) */}
        {imageUri && scanning && (
          <Card style={styles.scanningCard}>
            <View style={styles.scanningImageContainer}>
              {imageUri.startsWith('http') ? (
                <Image source={{ uri: imageUri }} style={styles.scanningImage} resizeMode="cover" />
              ) : (
                <View style={[styles.scanningImage, styles.mockReceiptPlaceholder]}>
                  <Icon name="receipt-outline" size={48} color="rgba(255, 255, 255, 0.25)" />
                  <Text style={styles.mockReceiptTextPlaceholder}>Processing Captured Receipt</Text>
                </View>
              )}
              {/* Animated Laser Line */}
              <Animated.View style={[styles.laserLine, { transform: [{ translateY: laserAnim }] }]} />
              {/* Blur Overlay */}
              <View style={styles.scanningOverlay} />
            </View>
            <View style={styles.scanningDetails}>
              <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: spacing.sm }} />
              <Text style={styles.scanningStatusText}>{statusText}</Text>
            </View>
          </Card>
        )}

        {/* Step 3: Receipt Preview & Detected Fields */}
        {imageUri && !scanning && (
          <View style={styles.resultsContainer}>
            {/* Receipt Preview Card */}
            <Card style={styles.previewCard}>
              <Text style={styles.previewLabel}>Receipt Preview</Text>
              <View style={styles.previewFrame}>
                {imageUri.startsWith('http') ? (
                  <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%', borderRadius: radius.md }} resizeMode="contain" />
                ) : (
                  <View style={styles.mockReceipt}>
                    <Icon name="receipt-outline" size={40} color={colors.text.muted} />
                    <Text style={styles.mockReceiptText}>Custom Captured Receipt</Text>
                  </View>
                )}
              </View>
              
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => {
                  setImageUri(null);
                  setScanComplete(false);
                  setMerchant('');
                  setAmount('');
                  setCategory('');
                  setPaymentMethod('');
                  setDate('');
                }}
                style={styles.retakeBtn}
              >
                <Icon name="refresh" size={16} color={colors.danger} />
                <Text style={styles.retakeText}>Clear Receipt</Text>
              </TouchableOpacity>
            </Card>

            {/* Detected Fields Form */}
            {scanComplete && (
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
          </View>
        )}

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
  uploadSection: {
    marginTop: spacing.xxl,
    alignItems: 'center',
  },
  hintText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.lineHeights.base + 2,
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: spacing.lg,
  },
  sourceCard: {
    flex: 1,
    height: 120,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(75, 140, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  progressCard: {
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  progressTitle: {
  fontSize: typography.sizes.sm,
  fontWeight: typography.weights.semibold,
  color: colors.text.primary,
  textAlign: "center",
},
  progressPct: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  barBg: {
    height: 6,
    backgroundColor: colors.divider,
    borderRadius: radius.full,
    width: '100%',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  resultsContainer: {
    marginTop: spacing.md,
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
    height: 140,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.divider,
  },
  mockReceipt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  mockReceiptText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  retakeText: {
    color: colors.danger,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
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
  sampleItemCard: {
    width: '100%',
    height: 72,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sampleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  sampleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(138, 63, 252, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sampleMeta: {
    flex: 1,
    justifyContent: 'center',
  },
  sampleTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  sampleDesc: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  progressSubtext: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  scanningCard: {
    padding: 0,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    backgroundColor: colors.card,
  },
  scanningImageContainer: {
    width: '100%',
    height: 220,
    position: 'relative',
    backgroundColor: '#050609',
    justifyContent: 'center',
  },
  scanningImage: {
    width: '100%',
    height: '100%',
    opacity: 0.45,
  },
  mockReceiptPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#090A0F',
  },
  mockReceiptTextPlaceholder: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: typography.sizes.xs + 1,
    fontWeight: typography.weights.bold,
  },
  laserLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 12,
    elevation: 6,
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(138, 63, 252, 0.04)',
  },
  scanningDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(138, 63, 252, 0.05)',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  scanningStatusText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
});

export default ReceiptScannerScreen;
