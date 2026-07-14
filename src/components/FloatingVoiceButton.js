import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  PermissionsAndroid,
  NativeModules,
  NativeEventEmitter,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, spacing, radius, shadow, typography } from '../theme';
import apiClient from '../api/client';
import { useCreateTransaction } from '../hooks/useTransactions';
import { useAuth } from '../hooks/useAuth';
import { useAlert } from '../context/AlertContext';
import Card from './molecules/Card';
import PrimaryButton from './atoms/PrimaryButton';
import dayjs from 'dayjs';

const { SpeechRecognitionModule } = NativeModules;

const FloatingVoiceButton = () => {
  const { isAuthenticated } = useAuth();
  const { showAlert } = useAlert();
  const [modalVisible, setModalVisible] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState(null);

  const createMutation = useCreateTransaction();

  // Soundwave Animation Refs
  const wave1 = useRef(new Animated.Value(10)).current;
  const wave2 = useRef(new Animated.Value(10)).current;
  const wave3 = useRef(new Animated.Value(10)).current;
  const wave4 = useRef(new Animated.Value(10)).current;

  // Debug log to check if component mounts and auth state
  console.log('[FloatingVoiceButton] Rendered. isAuthenticated:', isAuthenticated, 'NativeModuleLoaded:', !!SpeechRecognitionModule);

  // Set up native speech events subscriptions
  useEffect(() => {
    if (!modalVisible) return;

    if (!SpeechRecognitionModule) {
      showAlert(
        'Native Module Missing',
        'The native SpeechRecognitionModule is not loaded.\n\nPlease run "npm run android" to compile the new native module into the app.',
        [{ text: 'OK', onPress: () => setModalVisible(false) }]
      );
      return;
    }

    const eventEmitter = new NativeEventEmitter(SpeechRecognitionModule);

    const onSpeechStartSub = eventEmitter.addListener('onSpeechStart', () => {
      setIsListening(true);
      setParsedData(null);
    });

    const onSpeechEndSub = eventEmitter.addListener('onSpeechEnd', () => {
      setIsListening(false);
    });

    const onSpeechResultsSub = eventEmitter.addListener('onSpeechResults', (event) => {
      setInputText(event.text);
      setIsListening(false);
    });

    const onSpeechPartialResultsSub = eventEmitter.addListener('onSpeechPartialResults', (event) => {
      setInputText(event.text);
    });

    const onSpeechErrorSub = eventEmitter.addListener('onSpeechError', (event) => {
      setIsListening(false);
      // Suppress annoying timeout logs if the user just stopped speaking manually
      if (event.code !== 7 && event.code !== 6) { 
        showAlert('Speech Error', event.message || 'An error occurred during recognition.');
      }
    });

    return () => {
      onSpeechStartSub.remove();
      onSpeechEndSub.remove();
      onSpeechResultsSub.remove();
      onSpeechPartialResultsSub.remove();
      onSpeechErrorSub.remove();
    };
  }, [modalVisible]);

  useEffect(() => {
    let anim1, anim2, anim3, anim4;

    if (isListening) {
      const createAnimationLoop = (val, max) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(val, {
              toValue: max,
              duration: 350 + Math.random() * 150,
              useNativeDriver: false,
            }),
            Animated.timing(val, {
              toValue: 10,
              duration: 350 + Math.random() * 150,
              useNativeDriver: false,
            }),
          ])
        );
      };

      anim1 = createAnimationLoop(wave1, 42);
      anim2 = createAnimationLoop(wave2, 58);
      anim3 = createAnimationLoop(wave3, 35);
      anim4 = createAnimationLoop(wave4, 48);

      anim1.start();
      anim2.start();
      anim3.start();
      anim4.start();
    } else {
      wave1.setValue(10);
      wave2.setValue(10);
      wave3.setValue(10);
      wave4.setValue(10);
    }

    return () => {
      if (anim1) anim1.stop();
      if (anim2) anim2.stop();
      if (anim3) anim3.stop();
      if (anim4) anim4.stop();
    };
  }, [isListening]);


  if (!isAuthenticated) return null;

  const handleStartListening = async () => {
    if (Platform.OS === 'android') {
      try {
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );

        if (!hasPermission) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
              title: 'Microphone Permission Required',
              message: 'This app needs access to your microphone to transcribe voice transactions.',
              buttonPositive: 'OK',
            }
          );
          if (granted !== PermissionsAndroid.RESULTS_GRANTED) {
            showAlert('Permission Denied', 'Microphone permission is required to use Voice AI.');
            return;
          }
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }

    setParsedData(null);
    setInputText('');
    
    try {
      SpeechRecognitionModule.startListening();
    } catch (e) {
      showAlert('Error', 'Failed to start speech recognition.');
    }
  };

  const handleStopListening = () => {
    try {
      SpeechRecognitionModule.stopListening();
    } catch (e) {
      // Ignore
    }
  };

  const handleProcessText = async () => {
    if (!inputText.trim()) {
      showAlert('Empty query', 'Please speak or type a transaction details query.');
      return;
    }

    setLoading(true);
    setParsedData(null);

    try {
      const response = await apiClient.post('ai/voice/transaction', {
        text: inputText,
      });

      if (response.data && response.data.success) {
        setParsedData(response.data.data);
      } else {
        showAlert('Processing Failed', 'Gemini failed to parse transaction fields.');
      }
    } catch (error) {
      showAlert('Error', error.response?.data?.message || error.message || 'Error communicating with AI parser.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTransaction = async () => {
    if (!parsedData) return;

    try {
      const payload = {
        type: parsedData.type || 'expense',
        category: parsedData.category || 'Other',
        amount: Number(parsedData.amount),
        description: parsedData.description || 'Voice AI Transaction',
        paymentMethod: parsedData.paymentMethod || 'UPI',
        transactionDate: parsedData.transactionDate || new Date().toISOString(),
        note: parsedData.note || 'Parsed via Voice AI Assistant',
      };

      await createMutation.mutateAsync(payload);
      showAlert('Saved!', 'Transaction successfully logged to ledger.', [
        {
          text: 'OK',
          onPress: () => {
            setModalVisible(false);
            setParsedData(null);
            setInputText('');
          },
        },
      ]);
    } catch (error) {
      showAlert('Error Saving', error.message || 'Failed to register transaction.');
    }
  };

  return (
    <>
      {/* Stable Floating Button */}
      <View style={styles.floatingContainer}>
        <TouchableOpacity
          style={styles.floatingButton}
          activeOpacity={0.8}
          onPress={() => {
            console.log('[FloatingVoiceButton] Button tapped! Opening modal');
            setModalVisible(true);
          }}
        >
          <Icon name="mic" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Voice Assistant Overlay Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleBox}>
                <Icon name="sparkles" size={18} color={colors.primary} />
                <Text style={styles.modalTitle}>Voice AI Assistant</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setParsedData(null);
                  setIsListening(false);
                }}
              >
                <Icon name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
              {/* Listening Mic State */}
              {!parsedData && (
                <View style={styles.micSection}>
                  <Text style={styles.listenInstruction}>
                    {isListening ? "Listening... Speak now" : "Tap the mic and speak transaction details"}
                  </Text>

                  {/* Pulsing Visual Waveform */}
                  <View style={styles.waveRow}>
                    <Animated.View style={[styles.waveBar, { height: wave1 }]} />
                    <Animated.View style={[styles.waveBar, { height: wave2, backgroundColor: colors.secondary }]} />
                    <Animated.View style={[styles.waveBar, { height: wave3 }]} />
                    <Animated.View style={[styles.waveBar, { height: wave4, backgroundColor: colors.secondary }]} />
                  </View>

                  <TouchableOpacity
                    style={[styles.micBigButton, isListening && styles.micActive]}
                    onPress={isListening ? handleStopListening : handleStartListening}
                    activeOpacity={0.8}
                  >
                    <Icon name={isListening ? "stop" : "mic"} size={42} color="#FFFFFF" />
                  </TouchableOpacity>

                  <Text style={styles.exampleText}>
                    e.g. "I spent 400 rupees on dinner yesterday at Burger King"
                  </Text>
                </View>
              )}

              {/* Text Fallback / Input Editor */}
              {!parsedData && (
                <View style={styles.inputSection}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Or type voice command details..."
                    placeholderTextColor={colors.text.muted}
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                  />

                  {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing.md }} />
                  ) : (
                    <View style={styles.processBtnWrapper}>
                      <PrimaryButton
                        title="Process Command"
                        onPress={handleProcessText}
                        type="primary"
                      />
                    </View>
                  )}
                </View>
              )}

              {/* Parsed Result Form Preview */}
              {parsedData && (
                <View style={styles.resultContainer}>
                  <Text style={styles.successLabel}>AI Detected Transaction</Text>
                  
                  <Card style={styles.resultCard}>
                    <View style={styles.resultRow}>
                      <Text style={styles.resultFieldName}>Description</Text>
                      <Text style={styles.resultFieldValue}>{parsedData.description}</Text>
                    </View>
                    <View style={styles.divider} />

                    <View style={styles.resultRow}>
                      <Text style={styles.resultFieldName}>Amount</Text>
                      <Text style={[styles.resultFieldValue, styles.amountHighlight]}>
                        ₹{parsedData.amount}
                      </Text>
                    </View>
                    <View style={styles.divider} />

                    <View style={styles.resultRow}>
                      <Text style={styles.resultFieldName}>Category</Text>
                      <Text style={styles.resultFieldValue}>{parsedData.category}</Text>
                    </View>
                    <View style={styles.divider} />

                    <View style={styles.resultRow}>
                      <Text style={styles.resultFieldName}>Type</Text>
                      <Text style={[styles.resultFieldValue, { textTransform: 'capitalize', color: parsedData.type === 'income' ? colors.success : colors.danger }]}>
                        {parsedData.type}
                      </Text>
                    </View>
                    <View style={styles.divider} />

                    {parsedData.paymentMethod && (
                      <>
                        <View style={styles.resultRow}>
                          <Text style={styles.resultFieldName}>Payment Method</Text>
                          <Text style={styles.resultFieldValue}>{parsedData.paymentMethod}</Text>
                        </View>
                        <View style={styles.divider} />
                      </>
                    )}

                    <View style={styles.resultRow}>
                      <Text style={styles.resultFieldName}>Date</Text>
                      <Text style={styles.resultFieldValue}>
                        {dayjs(parsedData.transactionDate).format('YYYY-MM-DD')}
                      </Text>
                    </View>
                  </Card>

                  <View style={styles.actionBtnRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.cancelBtn]}
                      onPress={() => setParsedData(null)}
                    >
                      <Text style={styles.cancelText}>Edit Details</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.saveBtn]}
                      onPress={handleSaveTransaction}
                    >
                      <Text style={styles.saveText}>Approve & Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: 104,
    right: 20,
    width: 56,
    height: 56,
    zIndex: 9999,
    elevation: 99,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.lg,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalHeaderTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  modalTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  micSection: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  listenInstruction: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  micBigButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.md,
    elevation: 6,
    marginVertical: spacing.lg,
  },
  micActive: {
    backgroundColor: colors.danger,
  },
  exampleText: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 18,
    paddingHorizontal: spacing.xl,
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 60,
    marginBottom: spacing.xs,
  },
  waveBar: {
    width: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  inputSection: {
    marginTop: spacing.md,
  },
  textInput: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.sm,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  processBtnWrapper: {
    marginTop: spacing.md,
  },
  resultContainer: {
    marginTop: spacing.xs,
  },
  successLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.success,
    marginBottom: spacing.sm,
    alignSelf: 'center',
  },
  resultCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  resultFieldName: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  resultFieldValue: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontWeight: typography.weights.semibold,
  },
  amountHighlight: {
    fontSize: typography.sizes.lg,
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.xs,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  cancelBtn: {
    borderColor: colors.divider,
    backgroundColor: 'transparent',
  },
  cancelText: {
    color: colors.text.primary,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
  },
});

export default FloatingVoiceButton;
