import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { colors, spacing, typography, radius } from '../../theme';
import { useFriends } from '../../hooks/useFriends';
import { useGroups } from '../../hooks/useGroups';
import { useAuth } from '../../hooks/useAuth';
import GroupsListScreen from '../groups/GroupsListScreen';

const TABS = ['Friends', 'Groups', 'Requests'];

const getInitials = (name = '') =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

const AvatarCircle = ({ name, avatar, size = 50 }) => {
  const avatarUrl = typeof avatar === 'string' ? avatar : avatar?.url;
  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark || '#5E1BDB']}
      style={[
        styles.avatarFallback,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.avatarInitials, { fontSize: size * 0.35 }]}>
        {getInitials(name)}
      </Text>
    </LinearGradient>
  );
};

const FriendsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('Friends');
  const { user } = useAuth();
  const currentUserIdStr = String(user?._id || user?.id || '');
  const { friends, pendingRequests, loading, error, refetch, accept, reject, remove } =
    useFriends();



  const handleAccept = async (requestId) => {
    try {
      await accept(requestId);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not accept request');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await reject(requestId);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not reject request');
    }
  };

  const handleRemove = (friend) => {
    Alert.alert(
      'Remove Friend',
      `Remove ${friend.fullName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await remove(friend._id);
            } catch (err) {
              Alert.alert('Error', 'Could not remove friend');
            }
          },
        },
      ],
    );
  };

  // ─── Friend Card ─────────────────────────────────────────────────────────────
  const renderFriend = ({ item }) => {
    // Resolve the OTHER user object in the friendship
    const senderIdStr = String(item.sender?._id || item.sender?.id || item.sender || '');
    const friend = item.friend || (senderIdStr === currentUserIdStr ? item.receiver : item.sender) || {};

    return (
      <View style={styles.card}>
        <AvatarCircle name={friend.fullName} avatar={friend.avatar} />
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{friend.fullName}</Text>
          <Text style={styles.cardSub}>
            {friend.username ? `@${friend.username}` : friend.email || 'Friend'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => handleRemove({ _id: item._id, fullName: friend.fullName })}
        >
          <Icon name="person-remove-outline" size={18} color={colors.danger} />
        </TouchableOpacity>
      </View>
    );
  };

  // ─── Pending Request Card ────────────────────────────────────────────────────
  const renderRequest = ({ item }) => {
    const sender = item.sender || {};
    return (
      <View style={styles.card}>
        <AvatarCircle name={sender.fullName} avatar={sender.avatar} />
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{sender.fullName}</Text>
          <Text style={styles.cardSub}>
            {sender.username ? `@${sender.username}` : sender.email || ''}
          </Text>
          <Text style={styles.requestLabel}>Wants to connect</Text>
        </View>
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={() => handleAccept(item._id)}
          >
            <Icon name="checkmark" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={() => handleReject(item._id)}
          >
            <Icon name="close" size={16} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const isEmpty =
    activeTab === 'Friends' ? friends.length === 0 : pendingRequests.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Friends</Text>
          <Text style={styles.headerSubtitle}>
            {friends.length} friend{friends.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => navigation.navigate('UserSearch')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark || '#5E1BDB']}
            style={styles.searchButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name="person-add-outline" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          const badge = tab === 'Requests' && pendingRequests.length > 0;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab}
              </Text>
              {badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingRequests.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      {activeTab === 'Groups' ? (
        <GroupsListScreen navigation={navigation} />
      ) : loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Icon name="cloud-offline-outline" size={48} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : isEmpty ? (
        <View style={styles.centered}>
          <View style={styles.emptyCircle}>
            <Icon
              name={activeTab === 'Friends' ? 'people-outline' : 'mail-outline'}
              size={52}
              color={colors.primary}
            />
          </View>
          <Text style={styles.emptyTitle}>
            {activeTab === 'Friends' ? 'No friends yet' : 'No pending requests'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'Friends'
              ? 'Tap the + button to find and add people you know'
              : 'When someone sends you a request, it will appear here'}
          </Text>
          {activeTab === 'Friends' && (
            <TouchableOpacity
              style={styles.findButton}
              onPress={() => navigation.navigate('UserSearch')}
            >
              <Icon name="search-outline" size={16} color={colors.primary} />
              <Text style={styles.findButtonText}>Find People</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={activeTab === 'Friends' ? friends : pendingRequests}
          keyExtractor={(item) => item._id}
          renderItem={activeTab === 'Friends' ? renderFriend : renderRequest}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes?.xl || 22,
    fontWeight: '800',
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: typography.sizes?.sm || 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  searchButton: {
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  searchButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg || 14,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md || 10,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabLabel: {
    fontSize: typography.sizes?.sm || 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  tabLabelActive: {
    color: '#fff',
  },
  badge: {
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg || 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontWeight: '800',
    color: '#fff',
  },
  cardInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  cardName: {
    fontSize: typography.sizes?.md || 15,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  cardSub: {
    fontSize: typography.sizes?.sm || 12,
    color: colors.text.secondary,
  },
  requestLabel: {
    fontSize: typography.sizes?.xs || 11,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 3,
  },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.danger + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.danger + '20',
    borderWidth: 1.5,
    borderColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: spacing.sm,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.sizes?.sm || 13,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  errorText: {
    fontSize: typography.sizes?.sm || 13,
    color: colors.danger,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: typography.sizes?.sm || 13,
  },
  emptyCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.sizes?.lg || 18,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.sizes?.sm || 13,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  findButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.primary,
    marginTop: spacing.sm,
  },
  findButtonText: {
    fontSize: typography.sizes?.sm || 13,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default FriendsScreen;
