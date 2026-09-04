import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, spacing, radius, shadow, typography } from '../theme';
import apiClient from '../api/client';
import { useCreateTransaction } from '../hooks/useTransactions';
import { useAuth } from '../hooks/useAuth';
import { useAlert } from '../context/AlertContext';
import Card from './molecules/Card';
import dayjs from 'dayjs';
import ChatbotDrawer from './ChatbotDrawer';
import { usePremiumAccess } from '../hooks/usePremiumAccess';
import { useNavigation } from '@react-navigation/native';

const { SpeechRecognitionModule } = NativeModules;

// Fixed bar heights to avoid Math.random() on re-renders
const BAR_TARGETS = [32, 52, 44, 60, 38, 56, 28];
const NUM_BARS = BAR_TARGETS.length;

// Category → emoji map for result chip
const CATEGORY_EMOJI = {
  Food: '🍔',
  Grocery: '🛒',
  Shopping: '🛍️',
  Fuel: '⛽',
  Travel: '✈️',
  Entertainment: '🎬',
  Medical: '💊',
  Bills: '📄',
  Education: '📚',
  Salary: '💰',
  Other: '📦',
};

const FloatingVoiceButton = () => {
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();
  const { showAlert } = useAlert();
  const { hasPremiumAccess, showPremiumAlert } = usePremiumAccess();

  const [modalVisible, setModalVisible] = useState(false);
  const [chatbotVisible, setChatbotVisible] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState(null);

  const createMutation = useCreateTransaction();

  // Stable wave bar refs — one per bar, never recreated
  const waveRefs = useRef(BAR_TARGETS.map(() => new Animated.Value(4))).current;
  // Mic button pulse ref
  const micPulse = useRef(new Animated.Value(1)).current;
  // Floating button glow ref
  const glowAnim = useRef(new Animated.Value(0)).current;

  // ─── Waveform animation ───────────────────────────────────────
  useEffect(() => {
    let animations = [];

    if (isListening) {
      animations = waveRefs.map((val, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(val, {
              toValue: BAR_TARGETS[i],
              duration: 300 + i * 60,
              useNativeDriver: false,
            }),
            Animated.timing(val, {
              toValue: 4 + i * 2,
              duration: 300 + i * 60,
              useNativeDriver: false,
            }),
          ])
        )
      );
      animations.forEach(a => a.start());

      // Mic button pulse while listening
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(micPulse, { toValue: 1.08, duration: 500, useNativeDriver: true }),
          Animated.timing(micPulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      pulse.start();
      animations.push(pulse);
    } else {
      waveRefs.forEach((val, i) => {
        Animated.timing(val, {
          toValue: 4,
          duration: 200,
          useNativeDriver: false,
        }).start();
      });
      micPulse.setValue(1);
    }

    return () => animations.forEach(a => a.stop());
  }, [isListening]);

  // ─── Floating button glow when modal is open ──────────────────
  useEffect(() => {
    Animated.timing(glowAnim, {
      toValue: modalVisible ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [modalVisible]);

  // ─── Native speech event subscriptions ───────────────────────
  useEffect(() => {
    if (!modalVisible) return;

    if (!SpeechRecognitionModule) {
      showAlert(
        'Native Module Missing',
        'The SpeechRecognitionModule is not loaded.\n\nRun "npm run android" to recompile the native module.',
        [{ text: 'OK', onPress: () => setModalVisible(false) }]
      );
      return;
    }

    const emitter = new NativeEventEmitter(SpeechRecognitionModule);

    const subs = [
      emitter.addListener('onSpeechStart', () => {
        setIsListening(true);
        setParsedData(null);
      }),
      emitter.addListener('onSpeechEnd', () => {
        setIsListening(false);
      }),
      emitter.addListener('onSpeechResults', event => {
        setInputText(event.text);
        setIsListening(false);
      }),
      emitter.addListener('onSpeechPartialResults', event => {
        setInputText(event.text);
      }),
      emitter.addListener('onSpeechError', event => {
        setIsListening(false);
        // FIX: event.code is a STRING from native ("6" = cancelled, "7" = timeout)
        // Suppress noisy no-result / timeout errors — they are normal UX events
        const code = String(event.code);
        if (code !== '6' && code !== '7') {
          showAlert('Speech Error', event.message || 'An error occurred during recognition.');
        }
      }),
    ];

    return () => subs.forEach(s => s.remove());
  }, [modalVisible]);

  if (!isAuthenticated) return null;

  // ─── Handlers ─────────────────────────────────────────────────
  const handleStartListening = useCallback(async () => {
    if (!SpeechRecognitionModule) return;

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
              message: 'Expenso needs microphone access to log voice transactions.',
              buttonPositive: 'Allow',
            }
          );
          if (granted !== PermissionsAndroid.RESULTS_GRANTED) {
            showAlert('Permission Denied', 'Microphone permission is required to use Voice AI.');
            return;
          }
        }
      } catch (err) {
        console.warn('[VoiceAI] Permission error:', err);
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
  }, []);

  const handleStopListening = useCallback(() => {
    try {
      SpeechRecognitionModule?.stopListening();
    } catch (_) {}
  }, []);

  const handleProcessText = useCallback(async () => {
    if (!inputText.trim()) {
      showAlert('Empty Input', 'Please speak or type a transaction first.');
      return;
    }
    setLoading(true);
    setParsedData(null);
    try {
      const response = await apiClient.post('ai/voice/transaction', { text: inputText });
      if (response.data?.success) {
        setParsedData(response.data.data);
      } else {
        showAlert('Processing Failed', 'AI failed to parse the transaction details.');
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Error communicating with AI.';
      const isLimitReached =
        error.response?.data?.code === 'LIMIT_REACHED' || error.response?.status === 403;
      if (isLimitReached) {
        showAlert(
          'Limit Reached 🚀',
          errMsg || 'You have reached your Voice AI limit. Upgrade to Pro!',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Upgrade ⚡',
              onPress: () => {
                setModalVisible(false);
                navigation.navigate('Profile', { screen: 'Subscription', initial: false });
              },
            },
          ],
          'premium'
        );
      } else {
        showAlert('Error', errMsg);
      }
    } finally {
      setLoading(false);
    }
  }, [inputText]);

  const handleSaveTransaction = useCallback(async () => {
    if (!parsedData) return;
    try {
      await createMutation.mutateAsync({
        type: parsedData.type || 'expense',
        category: parsedData.category || 'Other',
        amount: Number(parsedData.amount),
        description: parsedData.description || 'Voice AI Transaction',
        paymentMethod: parsedData.paymentMethod || 'UPI',
        transactionDate: parsedData.transactionDate || new Date().toISOString(),
        note: parsedData.note || 'Logged via Voice AI',
      });
      showAlert('Saved! ✅', 'Transaction logged successfully.', [
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
      showAlert('Save Failed', error.message || 'Could not save the transaction.');
    }
  }, [parsedData]);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setIsListening(false);
    setParsedData(null);
  }, []);

  // ─── Derived styles ───────────────────────────────────────────
  const glowBorderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(138,63,252,0)', 'rgba(138,63,252,0.6)'],
  });

  // ─── Render ───────────────────────────────────────────────────
  return (
    <>
      {/* ── Floating Buttons ─────────────────────────────────── */}
      <View style={styles.floatingContainer}>
        {/* Chatbot Button */}
        <TouchableOpacity
          style={[styles.floatingButton, !hasPremiumAccess && styles.floatingButtonLocked]}
          activeOpacity={0.75}
          onPress={() => (hasPremiumAccess ? setChatbotVisible(true) : showPremiumAlert())}
        >
          <Icon name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
          {!hasPremiumAccess && (
            <View style={styles.proBadge}>
              <Icon name="lock-closed" size={7} color="#FFF" />
            </View>
          )}
        </TouchableOpacity>

        {/* Voice Button — glows when modal is open */}
        <Animated.View style={[styles.floatingButton, { borderColor: glowBorderColor }, !hasPremiumAccess && styles.floatingButtonLocked]}>
          <TouchableOpacity
            style={styles.floatingInner}
            activeOpacity={0.75}
            onPress={() => {
              if (hasPremiumAccess) {
                setModalVisible(true);
              } else {
                showPremiumAlert();
              }
            }}
          >
            <Icon name="mic-outline" size={20} color={colors.primary} />
            {!hasPremiumAccess && (
              <View style={styles.proBadge}>
                <Icon name="lock-closed" size={7} color="#FFF" />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* ── Voice Modal ───────────────────────────────────────── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={handleCloseModal}
      >
        <Pressable style={styles.backdrop} onPress={handleCloseModal} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetWrapper}
        >
          <View style={styles.sheet}>
            {/* Drag handle */}
            <View style={styles.dragHandle} />

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitle}>
                <LinearGradient
                  colors={['#8A3FFC', '#B06EFF']}
                  style={styles.headerIconBg}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Icon name="mic" size={14} color="#FFF" />
                </LinearGradient>
                <Text style={styles.headerText}>Voice AI Logger</Text>
              </View>
              <TouchableOpacity onPress={handleCloseModal} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <Icon name="close-circle" size={26} color={colors.text.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* ── Listening section ── */}
              {!parsedData && (
                <>
                  {/* Status label */}
                  <Text style={styles.statusLabel}>
                    {isListening
                      ? '🎙️  Listening... speak now'
                      : '  Tap the mic and speak a transaction'}
                  </Text>

                  {/* Waveform */}
                  <View style={styles.waveRow}>
                    {waveRefs.map((val, i) => (
                      <Animated.View
                        key={i}
                        style={[
                          styles.waveBar,
                          {
                            height: val,
                            backgroundColor: isListening
                              ? i % 2 === 0
                                ? colors.primary
                                : '#B06EFF'
                              : colors.divider,
                          },
                        ]}
                      />
                    ))}
                  </View>

                  {/* Big Mic Button */}
                  <Animated.View style={{ transform: [{ scale: micPulse }], alignSelf: 'center' }}>
                    <TouchableOpacity
                      onPress={isListening ? handleStopListening : handleStartListening}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={isListening ? ['#FF4D67', '#FF7070'] : ['#8A3FFC', '#B06EFF']}
                        style={styles.micButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Icon
                          name={isListening ? 'stop' : 'mic'}
                          size={38}
                          color="#FFF"
                        />
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>

                  <Text style={styles.exampleHint}>
                    e.g. "Spent ₹450 on dinner at Zomato using UPI"
                  </Text>

                  {/* Pill text input + send */}
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.pillInput}
                      placeholder="Or type transaction details..."
                      placeholderTextColor={colors.text.muted}
                      value={inputText}
                      onChangeText={setInputText}
                      multiline
                    />
                    {loading ? (
                      <ActivityIndicator
                        size="small"
                        color={colors.primary}
                        style={styles.sendBtn}
                      />
                    ) : (
                      <TouchableOpacity
                        style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                        onPress={handleProcessText}
                        disabled={!inputText.trim()}
                        activeOpacity={0.75}
                      >
                        <LinearGradient
                          colors={
                            inputText.trim()
                              ? ['#8A3FFC', '#B06EFF']
                              : [colors.divider, colors.divider]
                          }
                          style={styles.sendGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <Icon name="arrow-up" size={18} color="#FFF" />
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}

              {/* ── Result card ── */}
              {parsedData && (
                <View style={styles.resultSection}>
                  {/* Success header */}
                  <View style={styles.successBadge}>
                    <Icon name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={styles.successText}>AI Detected Transaction</Text>
                  </View>

                  <Card style={styles.resultCard}>
                    {/* Amount — hero */}
                    <View style={styles.amountHero}>
                      <Text style={styles.amountLabel}>Amount</Text>
                      <Text
                        style={[
                          styles.amountValue,
                          {
                            color:
                              parsedData.type === 'income' ? colors.success : colors.danger,
                          },
                        ]}
                      >
                        {parsedData.type === 'income' ? '+' : '−'}₹{parsedData.amount}
                      </Text>
                    </View>

                    <View style={styles.chipRow}>
                      {/* Type chip */}
                      <View
                        style={[
                          styles.chip,
                          {
                            backgroundColor:
                              parsedData.type === 'income'
                                ? 'rgba(0,210,106,0.12)'
                                : 'rgba(255,77,103,0.12)',
                            borderColor:
                              parsedData.type === 'income' ? colors.success : colors.danger,
                          },
                        ]}
                      >
                        <Icon
                          name={
                            parsedData.type === 'income' ? 'arrow-down-circle' : 'arrow-up-circle'
                          }
                          size={12}
                          color={parsedData.type === 'income' ? colors.success : colors.danger}
                        />
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color:
                                parsedData.type === 'income' ? colors.success : colors.danger,
                            },
                          ]}
                        >
                          {parsedData.type?.toUpperCase()}
                        </Text>
                      </View>

                      {/* Category chip */}
                      <View style={[styles.chip, styles.categoryChip]}>
                        <Text style={styles.chipEmoji}>
                          {CATEGORY_EMOJI[parsedData.category] || '📦'}
                        </Text>
                        <Text style={[styles.chipText, { color: colors.primary }]}>
                          {parsedData.category}
                        </Text>
                      </View>

                      {/* Date chip */}
                      <View style={[styles.chip, styles.dateChip]}>
                        <Icon name="calendar-outline" size={11} color={colors.text.secondary} />
                        <Text style={[styles.chipText, { color: colors.text.secondary }]}>
                          {dayjs(parsedData.transactionDate).format('DD MMM')}
                        </Text>
                      </View>
                    </View>

                    {/* Description */}
                    <View style={styles.detailRow}>
                      <Icon name="document-text-outline" size={14} color={colors.text.muted} />
                      <Text style={styles.detailText}>{parsedData.description}</Text>
                    </View>

                    {parsedData.paymentMethod && (
                      <View style={styles.detailRow}>
                        <Icon name="card-outline" size={14} color={colors.text.muted} />
                        <Text style={styles.detailText}>{parsedData.paymentMethod}</Text>
                      </View>
                    )}

                    {parsedData.note ? (
                      <View style={styles.detailRow}>
                        <Icon name="chatbubble-outline" size={14} color={colors.text.muted} />
                        <Text style={styles.detailText}>{parsedData.note}</Text>
                      </View>
                    ) : null}
                  </Card>

                  {/* Action buttons */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => setParsedData(null)}
                      activeOpacity={0.75}
                    >
                      <Icon name="pencil-outline" size={15} color={colors.text.primary} />
                      <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.saveBtn}
                      onPress={handleSaveTransaction}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={['#8A3FFC', '#B06EFF']}
                        style={styles.saveBtnGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Icon name="checkmark" size={16} color="#FFF" />
                        <Text style={styles.saveBtnText}>Approve & Save</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Chatbot Drawer ──────────────────────────────────── */}
      <ChatbotDrawer
        visible={chatbotVisible}
        onClose={() => setChatbotVisible(false)}
        navigation={navigation}
      />
    </>
  );
};

const styles = StyleSheet.create({
  // ── Floating buttons ───────────────────────────────────────────
  floatingContainer: {
    position: 'absolute',
    bottom: 96,
    right: 16,
    alignItems: 'center',
    gap: 10,
    zIndex: 9999,
    elevation: 99,
  },
  floatingButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(18,19,26,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(138,63,252,0)',
    ...shadow.md,
    elevation: 8,
  },
  floatingInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  floatingButtonLocked: {
    opacity: 0.6,
  },
  proBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.primary,
    borderRadius: 7,
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.card,
  },

  // ── Modal / Sheet ──────────────────────────────────────────────
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.divider,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },

  // ── Header ────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: 0.2,
  },

  // ── Body ──────────────────────────────────────────────────────
  body: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },

  // ── Listening state ───────────────────────────────────────────
  statusLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 64,
    marginBottom: spacing.md,
  },
  waveBar: {
    width: 5,
    borderRadius: 3,
  },
  micButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.md,
    elevation: 10,
    marginBottom: spacing.md,
  },
  exampleHint: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },

  // ── Pill input ────────────────────────────────────────────────
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  pillInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.sm,
    minHeight: 48,
    maxHeight: 120,
    textAlignVertical: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Result card ───────────────────────────────────────────────
  resultSection: {
    gap: spacing.md,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'center',
  },
  successText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.success,
  },
  resultCard: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  amountHero: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    marginBottom: spacing.sm,
  },
  amountLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.muted,
    fontWeight: typography.weights.medium,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: typography.weights.bold,
    letterSpacing: -0.5,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChip: {
    borderColor: 'rgba(138,63,252,0.35)',
    backgroundColor: 'rgba(138,63,252,0.1)',
  },
  dateChip: {
    borderColor: colors.divider,
    backgroundColor: colors.surface,
  },
  chipEmoji: {
    fontSize: 12,
  },
  chipText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  detailText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },

  // ── Action buttons ────────────────────────────────────────────
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 50,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
  },
  editBtnText: {
    color: colors.text.primary,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
  },
  saveBtn: {
    flex: 2,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  saveBtnGradient: {
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
  },
});

export default FloatingVoiceButton;
