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

// Icon + color per notification type
const TYPE_META = {
  budget:   { icon: 'wallet-outline',       color: '#FF9500', label: 'Budget'   },
  expense:  { icon: 'arrow-up-circle-outline', color: '#FF4D67', label: 'Expense' },
  income:   { icon: 'arrow-down-circle-outline', color: '#00D26A', label: 'Income' },
  reminder: { icon: 'alarm-outline',         color: '#5856D6', label: 'Reminder' },
  ai:       { icon: 'sparkles-outline',      color: '#AF52DE', label: 'AI'      },
  security: { icon: 'shield-checkmark-outline', color: '#FF3B30', label: 'Security' },
  system:   { icon: 'information-circle-outline', color: '#5AC8FA', label: 'System' },
};

const getTypeMeta = (type: string) => {
  const key = type as keyof typeof TYPE_META;
  return TYPE_META[key] || TYPE_META.system;
};

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

interface NotificationCardProps {
  item: any;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}

// ─── Single Notification Card ─────────────────────────────────────────────────
const NotificationCard: React.FC<NotificationCardProps> = ({ item, onRead, onDelete }) => {
  const meta = getTypeMeta(item.type || 'system');
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 200 }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200 }).start();

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => !item.read && onRead(item._id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, !item.read && styles.cardUnread]}
      >
        {/* Unread accent bar */}
        {!item.read && <View style={[styles.unreadBar, { backgroundColor: meta.color }]} />}

        {/* Icon */}
        <View style={[styles.iconBox, { backgroundColor: meta.color + '20' }]}>
          <Icon name={meta.icon} size={22} color={meta.color} />
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <View style={[styles.typeBadge, { backgroundColor: meta.color + '18' }]}>
              <Text style={[styles.typeBadgeText, { color: meta.color }]}>{meta.label}</Text>
            </View>
            <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
          </View>

          <Text style={[styles.cardTitle, !item.read && styles.cardTitleUnread]}>
            {item.title}
          </Text>
          <Text style={styles.cardBody} numberOfLines={2}>
            {item.body}
          </Text>

          {/* Actions row */}
          <View style={styles.cardActions}>
            {!item.read && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => onRead(item._id)}
                activeOpacity={0.7}
              >
                <Icon name="checkmark-circle-outline" size={14} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.primary }]}>Mark read</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onDelete(item._id)}
              activeOpacity={0.7}
            >
              <Icon name="trash-outline" size={14} color={colors.danger} />
              <Text style={[styles.actionText, { color: colors.danger }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Unread dot */}
        {!item.read && <View style={[styles.unreadDot, { backgroundColor: meta.color }]} />}
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
    <Text style={styles.emptySubtitle}>No notifications yet. Budget alerts, expense summaries and AI tips will appear here.</Text>
  </View>
);

interface NotificationScreenProps {
  navigation: any;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
const NotificationScreen: React.FC<NotificationScreenProps> = ({ navigation }) => {
  const { showAlert } = useAlert() as any;
  const { data: notifications = [], isLoading, refetch } = useNotifications();
  const markReadMutation   = useMarkNotificationRead();
  const deleteMutation     = useDeleteNotification();
  const clearMutation      = useClearNotifications();

  const unreadCount = (notifications as any[]).filter((n: any) => !n.read).length;

  const handleRead = (id: string) => {
    (markReadMutation as any).mutate(id);
  };

  const handleDelete = (id: string) => {
    (deleteMutation as any).mutate(id);
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
          onPress: () => (clearMutation as any).mutate(),
        },
      ]
    );
  };

  const handleMarkAllRead = () => {
    const unread = (notifications as any[]).filter((n: any) => !n.read);
    unread.forEach((n: any) => (markReadMutation as any).mutate(n._id));
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

      {/* Mark all read pill — only shown when there are unread items */}
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

      {/* Body */}
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
              onRead={handleRead}
              onDelete={handleDelete}
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
    fontSize: 10,
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
    borderColor: colors.primary + '30',
    backgroundColor: colors.primary + '06',
  },
  unreadBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
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
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 3,
  },
  cardTitleUnread: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  cardBody: {
    fontSize: 11,
    color: colors.text.muted,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
    flexShrink: 0,
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
});