import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import {
  getNotifications,
  deleteNotification,
  clearNotifications,
  markAsRead,
  AppNotification,
} from '../services/notificationStorage';

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const loadNotifications = async () => {
    const data = await getNotifications();
    setNotifications(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, []),
  );

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    loadNotifications();
  };

  const handleRead = async (id: string) => {
    await markAsRead(id);
    loadNotifications();
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear Notifications',
      'Are you sure you want to delete all notifications?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearNotifications();
            loadNotifications();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Notifications</Text>

        {notifications.length > 0 && (
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clear}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No notifications yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleRead(item.id)}>
              <View style={styles.card}>
                {!item.read && <View style={styles.unreadDot} />}

                <Text style={styles.title}>{item.title}</Text>

                <Text style={styles.body}>{item.body}</Text>

                <Text style={styles.time}>{item.time}</Text>

                <TouchableOpacity
                  onPress={() => handleDelete(item.id)}
                  style={styles.deleteButton}>
                  <Text style={styles.deleteText}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 20,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },

  clear: {
    color: '#3B82F6',
    fontWeight: '700',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyText: {
    color: '#94A3B8',
    fontSize: 16,
  },

  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    position: 'relative',
  },

  unreadDot: {
    position: 'absolute',
    right: 15,
    top: 15,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },

  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  body: {
    color: '#CBD5E1',
    marginTop: 8,
  },

  time: {
    color: '#94A3B8',
    marginTop: 8,
    fontSize: 12,
  },

  deleteButton: {
    alignSelf: 'flex-end',
    marginTop: 12,
  },

  deleteText: {
    color: '#EF4444',
    fontWeight: '600',
  },
});