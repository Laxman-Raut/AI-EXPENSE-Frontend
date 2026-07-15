import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, spacing, radius, typography, shadow } from '../theme';
import { sendChatbotMessage, getChatbotHistory, clearChatbotHistory } from '../api/chatbot';
import { useAlert } from '../context/AlertContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.85;

const ChatbotDrawer = ({ visible, onClose }) => {
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Monitor keyboard visibility
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const translateX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);

  // Handle slide animations when visible changes
  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      loadHistory();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: SCREEN_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShouldRender(false);
      });
    }
  }, [visible, translateX, backdropOpacity, loadHistory]);

  // Auto-scroll messages list to bottom
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isSending]);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await getChatbotHistory();
      if (res.success) {
        setMessages(res.history);
      }
    } catch (err) {
      console.warn('[ChatbotDrawer] Error loading history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessageText = inputText;
    setInputText('');

    // Add user message to local UI state immediately
    const tempUserMsg = {
      _id: Date.now().toString(),
      role: 'user',
      message: userMessageText,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setIsSending(true);

    try {
      const res = await sendChatbotMessage(userMessageText);
      if (res.success) {
        const assistantMsg = {
          _id: (Date.now() + 1).toString(),
          role: 'assistant',
          message: res.reply,
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        showAlert('Error', 'Could not get response from FinMate.');
      }
    } catch (err) {
      showAlert('Error', 'Failed to send message. Check network connection.');
    } finally {
      setIsSending(false);
    }
  };

  const handleClearChat = () => {
    showAlert(
      'Clear Conversation?',
      'Are you sure you want to delete all messages? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await clearChatbotHistory();
              if (res.success) {
                setMessages([]);
              }
            } catch (err) {
              showAlert('Error', 'Failed to clear history.');
            }
          },
        },
      ]
    );
  };

  if (!shouldRender) return null;

  // Format message timestamps
  const formatMsgTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const renderMessageItem = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}>
        {!isUser && (
          <View style={styles.assistantAvatar}>
            <Icon name="sparkles" size={14} color="#FFFFFF" />
          </View>
        )}
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
            {item.message}
          </Text>
          <Text style={[styles.msgTime, isUser ? styles.userTime : styles.assistantTime]}>
            {formatMsgTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdropClickArea} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Drawer Body */}
      <Animated.View
        style={[
          styles.drawerPanel,
          {
            transform: [{ translateX }],
            paddingTop: Math.max(insets.top, spacing.md),
            paddingBottom: 0,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleBox}>
            <Icon name="sparkles" size={18} color={colors.primary} />
            <Text style={styles.headerTitle}>FinMate AI</Text>
          </View>
          <View style={styles.headerActions}>
            {messages.length > 0 && (
              <TouchableOpacity onPress={handleClearChat} style={styles.headerActionBtn}>
                <Icon name="trash-outline" size={18} color={colors.text.secondary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.headerActionBtn}>
              <Icon name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Message Panel / Screen */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {loadingHistory ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Connecting to FinMate...</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.centerContainer}>
              <View style={styles.emptyIconCircle}>
                <Icon name="chatbubbles-outline" size={48} color={colors.primary} />
              </View>
              <Text style={styles.welcomeTitle}>Meet FinMate</Text>
              <Text style={styles.welcomeSubtitle}>
                Your smart personal financial advisor. Ask me to scan budgets, analyze your expenses, or plan savings.
              </Text>
              <View style={styles.promptSuggestions}>
                <TouchableOpacity
                  style={styles.suggestionPill}
                  onPress={() => setInputText('How much is my remaining budget?')}
                >
                  <Text style={styles.suggestionText}>"How much is my remaining budget?"</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.suggestionPill}
                  onPress={() => setInputText('Give me money saving tips')}
                >
                  <Text style={styles.suggestionText}>"Give me money saving tips"</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessageItem}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={
                isSending ? (
                  <View style={[styles.messageRow, styles.assistantRow]}>
                    <View style={styles.assistantAvatar}>
                      <Icon name="sparkles" size={14} color="#FFFFFF" />
                    </View>
                    <View style={[styles.messageBubble, styles.assistantBubble, styles.typingBubble]}>
                      <ActivityIndicator size="small" color={colors.text.secondary} />
                    </View>
                  </View>
                ) : null
              }
            />
          )}

          {/* Footer Input Area */}
          <View style={[
            styles.footer,
            {
              paddingBottom: keyboardVisible 
                ? spacing.md 
                : (Platform.OS === 'ios' ? 115 : 90)
            }
          ]}>
            <TextInput
              style={styles.textInput}
              placeholder="Message FinMate..."
              placeholderTextColor={colors.text.muted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={400}
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isSending}
              activeOpacity={0.8}
            >
              <Icon name="arrow-up" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  backdropClickArea: {
    flex: 1,
  },
  drawerPanel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: DRAWER_WIDTH,
    backgroundColor: colors.card,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    ...shadow.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerActionBtn: {
    padding: spacing.xs,
  },
  keyboardContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(138, 63, 252, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  welcomeTitle: {
    fontSize: typography.sizes.lg + 2,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  welcomeSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.xl,
  },
  promptSuggestions: {
    width: '100%',
    gap: spacing.sm,
  },
  suggestionPill: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
  messageList: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    maxWidth: '85%',
  },
  userRow: {
    alignSelf: 'flex-end',
  },
  assistantRow: {
    alignSelf: 'flex-start',
    gap: spacing.xs,
  },
  assistantAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  messageBubble: {
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 2,
  },
  assistantBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typingBubble: {
    width: 56,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageText: {
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: colors.text.primary,
  },
  msgTime: {
    fontSize: 8,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  userTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  assistantTime: {
    color: colors.text.muted,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.card,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    fontSize: typography.sizes.sm,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.divider,
  },
});

export default ChatbotDrawer;
