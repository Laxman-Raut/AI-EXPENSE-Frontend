import React, { useState, useMemo, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { colors, spacing, typography, radius } from '../../theme';
import { useGroups } from '../../hooks/useGroups';



const getInitials = (name = '') =>
  name
    .trim()
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'G';

const GroupAvatarCircle = ({ name, avatar, size = 52 }) => {
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
      <Text style={[styles.avatarInitials, { fontSize: size * 0.38 }]}>
        {getInitials(name)}
      </Text>
    </LinearGradient>
  );
};

const GroupsListScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { groups, loading, error, refetch } = useGroups();

  // ─── Real-Time Focus Sync ───────────────────────────────
  useFocusEffect(
    useCallback(() => {
      refetch(true);

      const interval = setInterval(() => {
        refetch(true);
      }, 4000);

      return () => clearInterval(interval);
    }, [refetch])
  );

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    return groups.filter((g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [groups, searchQuery]);

  const renderGroupCard = ({ item }) => {
    const memberCount = item.members ? item.members.length : 1;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('GroupDetails', { groupId: item._id, groupName: item.name })}
      >
        <GroupAvatarCircle name={item.name} avatar={item.avatar} />
        
        <View style={styles.cardInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.groupName} numberOfLines={1}>
              {item.name}
            </Text>
          </View>
          
          {item.description ? (
            <Text style={styles.groupDesc} numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <View style={styles.memberBadge}>
              <Icon name="people-outline" size={12} color={colors.primary} />
              <Text style={styles.memberBadgeText}>
                {memberCount} participant{memberCount !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </View>

        <Icon name="chevron-forward" size={18} color={colors.text.muted} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header - Dark Theme */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Groups</Text>
          <Text style={styles.headerSubtitle}>
            {groups.length} active group{groups.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateEditGroup')}
          activeOpacity={0.85}
        >
          <View style={styles.createButtonContent}>
            <Icon name="add" size={22} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Icon name="search-outline" size={18} color={colors.text.secondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search groups..."
          placeholderTextColor={colors.text.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={18} color={colors.text.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading groups...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Icon name="cloud-offline-outline" size={48} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : filteredGroups.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyCircle}>
            <Icon name="people-circle-outline" size={56} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No groups found' : 'No Groups Yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? `No groups matching "${searchQuery}"`
              : 'Create a group to share expenses with friends and track split costs easily!'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              style={styles.newGroupButton}
              onPress={() => navigation.navigate('CreateEditGroup')}
            >
              <Icon name="add-circle-outline" size={18} color="#fff" />
              <Text style={styles.newGroupButtonText}>Create New Group</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredGroups}
          keyExtractor={(item) => item._id}
          renderItem={renderGroupCard}
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
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  createButton: {
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  createButtonContent: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg || 14,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
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
    marginRight: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  groupDesc: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    gap: 4,
  },
  memberBadgeText: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '700',
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
    fontSize: 13,
    color: colors.text.secondary,
  },
  errorText: {
    fontSize: 13,
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
    fontSize: 13,
  },
  emptyCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  newGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    marginTop: spacing.sm,
  },
  newGroupButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});

export default GroupsListScreen;
