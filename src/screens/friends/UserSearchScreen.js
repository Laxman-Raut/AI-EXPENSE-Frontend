import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, radius } from '../../theme';
import { useUserSearch, useFriends } from '../../hooks/useFriends';
import { useAuth } from '../../hooks/useAuth';

const UserSearchScreen = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [sentRequests, setSentRequests] = useState(new Set());
  const { user: currentUser } = useAuth();
  const currentUserId = String(currentUser?._id || currentUser?.id || '');

  const { friends } = useFriends();
  const { results, loading, error, search, send } = useUserSearch();

  const debounceRef = useRef(null);

  const handleSearchChange = (text) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      search(text);
    }, 400);
  };

  const handleSendRequest = async (user) => {
    const targetId = String(user?._id || user?.id || '');
    if (!targetId) return;

    // Validation 1: Self request check
    if (currentUserId && targetId === currentUserId) {
      Alert.alert('Invalid Action', 'You cannot send a friend request to yourself.');
      return;
    }

    // Validation 2: Already friends check
    const isAlreadyFriend =
      user.isFriend ||
      user.friendshipStatus === 'accepted' ||
      (friends && friends.some((f) => String(f._id || f.id || f.friend?._id || f.friend?.id) === targetId));

    if (isAlreadyFriend) {
      Alert.alert('Already Friends', `${user.fullName || 'This user'} is already in your friends list.`);
      return;
    }

    // Validation 3: Request already sent check
    if (sentRequests.has(targetId) || user.friendshipStatus === 'sent') {
      Alert.alert('Request Sent', `Friend request has already been sent to ${user.fullName || 'this user'}.`);
      return;
    }

    try {
      await send(targetId);
      setSentRequests((prev) => new Set([...prev, targetId]));
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Could not send friend request';
      Alert.alert('Request Failed', msg);
    }
  };

  const getInitials = (name = '') =>
    name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();

  const renderUser = ({ item, index }) => {
    const itemId = String(item._id || item.id || '');
    const isAlreadyFriend =
      item.isFriend ||
      item.friendshipStatus === 'accepted' ||
      (friends &&
        friends.some((f) => {
          const fId = String(f._id || f.id || f.friend?._id || f.friend?.id || '');
          return fId === itemId;
        }));

    const isSent = sentRequests.has(itemId) || item.friendshipStatus === 'sent';
    const isReceived = item.friendshipStatus === 'received';

    return (
      <Animated.View style={styles.userCard}>
        <View style={styles.avatarContainer}>
          {item.avatar?.url ? (
            <Image source={{ uri: item.avatar.url }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{getInitials(item.fullName)}</Text>
            </View>
          )}
          <View style={styles.avatarOnline} />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.fullName}</Text>
          <Text style={styles.userHandle}>
            {item.username ? `@${item.username}` : item.email}
          </Text>
        </View>

        {isAlreadyFriend ? (
          <View style={styles.friendBadge}>
            <Icon name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.friendBadgeText}>Friends</Text>
          </View>
        ) : isSent ? (
          <View style={[styles.addButton, styles.addButtonSent]}>
            <Icon name="checkmark-circle" size={18} color={colors.success} />
            <Text style={[styles.addButtonText, styles.addButtonTextSent]}>Sent</Text>
          </View>
        ) : isReceived ? (
          <View style={[styles.addButton, styles.addButtonReceived]}>
            <Icon name="time-outline" size={18} color={colors.warning || '#FF9F0A'} />
            <Text style={[styles.addButtonText, styles.addButtonTextReceived]}>Pending</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleSendRequest(item)}
            activeOpacity={0.8}
          >
            <Icon name="person-add-outline" size={18} color={colors.primary} />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find People</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBar}>
          <Icon name="search-outline" size={20} color={colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, username or email..."
            placeholderTextColor={colors.text.muted}
            value={query}
            onChangeText={handleSearchChange}
            autoFocus
            returnKeyType="search"
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery('');
                search('');
              }}
            >
              <Icon name="close-circle" size={18} color={colors.text.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Icon name="alert-circle-outline" size={48} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : query.length < 2 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIllustration}>
            <Icon name="people-outline" size={64} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Find your people</Text>
          <Text style={styles.emptySubtitle}>
            Search by name, username or email to connect with friends
          </Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.centered}>
          <Icon name="person-remove-outline" size={48} color={colors.text.muted} />
          <Text style={styles.emptyTitle}>No users found</Text>
          <Text style={styles.emptySubtitle}>Try a different name or email address</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item._id}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes?.lg || 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  searchBarWrapper: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl || 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.sizes?.md || 15,
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg || 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.xs / 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary + '50',
  },
  avatarInitials: {
    fontSize: typography.sizes?.md || 15,
    fontWeight: '700',
    color: colors.primary,
  },
  avatarOnline: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.card,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.sizes?.md || 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  userHandle: {
    fontSize: typography.sizes?.sm || 13,
    color: colors.text.secondary,
  },
  friendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.success + '40',
    backgroundColor: colors.success + '15',
  },
  friendBadgeText: {
    fontSize: typography.sizes?.sm || 12,
    fontWeight: '700',
    color: colors.success,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  addButtonSent: {
    borderColor: colors.success,
    backgroundColor: colors.success + '15',
  },
  addButtonReceived: {
    borderColor: colors.warning || '#FF9F0A',
    backgroundColor: (colors.warning || '#FF9F0A') + '15',
  },
  addButtonText: {
    fontSize: typography.sizes?.sm || 12,
    fontWeight: '600',
    color: colors.primary,
  },
  addButtonTextSent: {
    color: colors.success,
  },
  addButtonTextReceived: {
    color: colors.warning || '#FF9F0A',
  },
  separator: {
    height: spacing.xs,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  emptyIllustration: {
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
});

export default UserSearchScreen;
