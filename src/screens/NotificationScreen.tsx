import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
  Animated,
  Modal,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import colors from '../theme/colors';
import spacing from '../theme/spacing';
import radius from '../theme/radius';
import { useAlert } from '../context/AlertContext';
import {
  useNotifications,
  useMarkNotificationRead,
  useDeleteNotification,
  useClearNotifications,
} from '../hooks/useNotifications';
import { resolveNotificationRoute, ResolvedNotificationRoute } from '../utils/notificationRouter';
import {
  getNotifications as getLocalNotifications,
  deleteNotification as deleteLocalNotification,
  clearNotifications as clearLocalNotifications,
} from '../services/notificationStorage';

const formatTime = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const formatFullDateTime = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface NotificationCardProps {
  item: any;
  onPress: () => void;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenDetails: (item: any) => void;
}

// ─── Single Notification Card ─────────────────────────────────────────────────
const NotificationCard: React.FC<NotificationCardProps> = ({
  item,
  onPress,
  onRead,
  onDelete,
  onOpenDetails,
}) => {
  const routeInfo: ResolvedNotificationRoute = resolveNotificationRoute(item);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true, tension: 200 }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200 }).start();

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        onLongPress={() => onOpenDetails(item)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, !item.read && styles.cardUnread]}
      >
        {/* Unread vertical accent bar */}
        {!item.read && <View style={[styles.unreadBar, { backgroundColor: routeInfo.color }]} />}

        {/* Icon with colored badge background */}
        <View style={[styles.iconBox, { backgroundColor: routeInfo.color + '22' }]}>
          <Icon name={routeInfo.icon} size={22} color={routeInfo.color} />
        </View>

        {/* Card Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <View style={[styles.typeBadge, { backgroundColor: routeInfo.color + '18' }]}>
              <Text style={[styles.typeBadgeText, { color: routeInfo.color }]}>
                {routeInfo.badgeLabel}
              </Text>
            </View>
            <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
          </View>

          <Text style={[styles.cardTitle, !item.read && styles.cardTitleUnread]}>
            {item.title}
          </Text>
          <Text style={styles.cardBody} numberOfLines={2}>
            {item.body}
          </Text>

          {/* Action Row */}
          <View style={styles.cardBottomRow}>
            {/* Direct navigation CTA button */}
            <TouchableOpacity
              style={[styles.actionCtaBtn, { backgroundColor: routeInfo.color + '15', borderColor: routeInfo.color + '30' }]}
              onPress={onPress}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionCtaText, { color: routeInfo.color }]}>
                {routeInfo.actionLabel}
              </Text>
              <Icon name="arrow-forward" size={12} color={routeInfo.color} />
            </TouchableOpacity>

            <View style={styles.rightActions}>
              {!item.read && (
                <TouchableOpacity
                  style={styles.actionIconBtn}
                  onPress={() => onRead(item._id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  <Icon name="checkmark-done-outline" size={16} color={colors.primary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.actionIconBtn}
                onPress={() => onDelete(item._id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
              >
                <Icon name="trash-outline" size={16} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Chevron icon indicating tap opens destination */}
        <View style={styles.chevronCol}>
          {!item.read && <View style={[styles.unreadDot, { backgroundColor: routeInfo.color }]} />}
          <Icon name="chevron-forward" size={16} color={colors.text.muted} style={{ marginTop: 4 }} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = () => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIconBox}>
      <Icon name="notifications-off-outline" size={48} color={colors.text.muted} />
    </View>
    <Text style={styles.emptyTitle}>All caught up!</Text>
    <Text style={styles.emptySubtitle}>
      No notifications yet. Budget alerts, daily tracking reminders, and recurring payment updates will appear here.
    </Text>
  </View>
);

interface NotificationScreenProps {
  navigation: any;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
const NotificationScreen: React.FC<NotificationScreenProps> = ({ navigation }) => {
  const { showAlert } = useAlert() as any;
  const { data: serverNotifications = [], isLoading, refetch } = useNotifications();
  const markReadMutation   = useMarkNotificationRead();
  const deleteMutation     = useDeleteNotification();
  const clearMutation      = useClearNotifications();

  const [localNotifications, setLocalNotifications] = useState<any[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);

  // Load local notifications on mount & refresh server data
  React.useEffect(() => {
    refetch();
    getLocalNotifications().then((local) => {
      if (Array.isArray(local)) {
        setLocalNotifications(local);
      }
    });
  }, [refetch]);

  // Merge server & local notifications, deduplicating by title + body and budget type
  const notifications = React.useMemo(() => {
    const list = [...(serverNotifications || [])];
    const serverTitles = new Set(list.map((s: any) => `${(s.title || '').trim()}_${(s.body || '').trim()}`));
    const hasServerBudgetAlert = list.some((s: any) => s.type === 'budget' || (s.title && s.title.toLowerCase().includes('budget')));

    localNotifications.forEach((loc: any) => {
      const key = `${(loc.title || '').trim()}_${(loc.body || '').trim()}`;
      const isLocalBudget = loc.type === 'budget' || (loc.title && loc.title.toLowerCase().includes('budget'));

      // If server already contains budget notifications, do not add duplicate local budget alerts
      if (isLocalBudget && hasServerBudgetAlert) {
        return;
      }

      if (!serverTitles.has(key)) {
        list.push({
          _id: loc.id || `local_${Math.random()}`,
          title: loc.title,
          body: loc.body,
          type: loc.type || 'budget',
          read: loc.read || false,
          createdAt: loc.time || new Date().toISOString(),
          data: loc.data || { screen: 'Budget' },
          isLocal: true,
        });
      }
    });

    return list.sort(
      (a: any, b: any) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }, [serverNotifications, localNotifications]);

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const handleRead = (id: string) => {
    (markReadMutation as any).mutate(id);
  };

  const handleDelete = (id: string) => {
    const isLocal = localNotifications.some((loc: any) => loc.id === id);
    if (isLocal) {
      deleteLocalNotification(id);
      setLocalNotifications((prev) => prev.filter((n) => n.id !== id));
    } else {
      (deleteMutation as any).mutate(id);
    }
    if (selectedNotification?._id === id) {
      setSelectedNotification(null);
    }
  };

  const handleClearAll = () => {
    showAlert(
      'Clear All Notifications',
      'Are you sure you want to delete all notifications? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            (clearMutation as any).mutate();
            clearLocalNotifications();
            setLocalNotifications([]);
          },
        },
      ]
    );
  };

  const handleMarkAllRead = () => {
    const unread = notifications.filter((n: any) => !n.read);
    unread.forEach((n: any) => (markReadMutation as any).mutate(n._id));
  };

  // ─── Direct Navigation on Click ─────────────────────────────────────────────
  const handleItemPress = (item: any) => {
    // 1. Mark as read immediately
    if (!item.read) {
      handleRead(item._id);
    }

    // 2. Resolve destination screen
    const target = resolveNotificationRoute(item);

    console.log(`[Notification] Navigating to: ${target.screen}`, target.params || '');

    try {
      if (target.params) {
        navigation.navigate(target.screen, target.params);
      } else {
        navigation.navigate(target.screen);
      }
    } catch (navErr: any) {
      console.error('[Notification] Navigation error:', navErr?.message);
      // Fallback: if navigation fails, open detail modal
      setSelectedNotification(item);
    }
  };

  const handleModalProceed = (item: any) => {
    setSelectedNotification(null);
    handleItemPress(item);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="chevron-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {notifications.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={handleClearAll}
            activeOpacity={0.7}
          >
            <Icon name="trash-outline" size={18} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>

      {/* Mark all read pill */}
      {unreadCount > 0 && (
        <TouchableOpacity
          style={styles.markAllPill}
          onPress={handleMarkAllRead}
          activeOpacity={0.8}
        >
          <Icon name="checkmark-done-outline" size={15} color={colors.primary} />
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      )}

      {/* Notifications List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading notifications…</Text>
        </View>
      ) : (
        <FlatList
          data={notifications as any[]}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <NotificationCard
              item={item}
              onPress={() => handleItemPress(item)}
              onRead={handleRead}
              onDelete={handleDelete}
              onOpenDetails={setSelectedNotification}
            />
          )}
          ListEmptyComponent={<EmptyState />}
          contentContainerStyle={
            notifications.length === 0
              ? styles.emptyListContent
              : styles.listContent
          }
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isLoading}
        />
      )}

      {/* ─── Notification Details Modal (Optional Read-More on Long Press) ──── */}
      <Modal
        visible={!!selectedNotification}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedNotification(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selectedNotification && (() => {
              const target = resolveNotificationRoute(selectedNotification);
              return (
                <>
                  <View style={styles.modalHeader}>
                    <View style={[styles.modalIconBox, { backgroundColor: target.color + '22' }]}>
                      <Icon name={target.icon} size={24} color={target.color} />
                    </View>
                    <View style={styles.modalHeaderInfo}>
                      <View style={[styles.typeBadge, { backgroundColor: target.color + '20', alignSelf: 'flex-start' }]}>
                        <Text style={[styles.typeBadgeText, { color: target.color }]}>{target.badgeLabel}</Text>
                      </View>
                      <Text style={styles.modalTimeText}>
                        {formatFullDateTime(selectedNotification.createdAt)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.modalCloseBtn}
                      onPress={() => setSelectedNotification(null)}
                      activeOpacity={0.7}
                    >
                      <Icon name="close" size={20} color={colors.text.secondary} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.modalBodyScroll} showsVerticalScrollIndicator={false}>
                    <Text style={styles.modalTitle}>{selectedNotification.title}</Text>
                    <Text style={styles.modalBodyText}>{selectedNotification.body}</Text>
                  </ScrollView>

                  <View style={styles.modalFooter}>
                    <TouchableOpacity
                      style={[styles.modalActionPrimaryBtn, { backgroundColor: target.color }]}
                      onPress={() => handleModalProceed(selectedNotification)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.modalActionPrimaryText}>{target.actionLabel}</Text>
                      <Icon name="arrow-forward" size={16} color="#FFFFFF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modalDeleteBtn}
                      onPress={() => handleDelete(selectedNotification._id)}
                      activeOpacity={0.7}
                    >
                      <Icon name="trash-outline" size={16} color={colors.danger} />
                      <Text style={styles.modalDeleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 56 : spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  countBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  clearBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,77,103,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,77,103,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Mark all pill ──────────────────────────────────────────────────────────
  markAllPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-end',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary + '15',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  markAllText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },

  // ── List ───────────────────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  emptyListContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },

  // ── Card ───────────────────────────────────────────────────────────────────
  cardWrapper: {
    marginBottom: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    overflow: 'hidden',
  },
  cardUnread: {
    borderColor: colors.primary + '35',
    backgroundColor: colors.primary + '07',
  },
  unreadBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
    borderRadius: 3,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  typeBadge: {
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 11,
    color: colors.text.muted,
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 3,
  },
  cardTitleUnread: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  cardBody: {
    fontSize: 12,
    color: colors.text.muted,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  actionCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionCtaText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronCol: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
    flexShrink: 0,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },

  // ── Loading ────────────────────────────────────────────────────────────────
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: 12,
  },

  // ── Empty ──────────────────────────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    marginTop: 80,
  },
  emptyIconBox: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ─── Modal Styles ──────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: colors.cardElevated || '#14151E',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  modalHeaderInfo: {
    flex: 1,
  },
  modalTimeText: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 3,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBodyScroll: {
    maxHeight: 280,
    marginVertical: spacing.md,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  modalBodyText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  modalActionPrimaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalActionPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,77,103,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,77,103,0.2)',
  },
  modalDeleteText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
});